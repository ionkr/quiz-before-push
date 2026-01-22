# Task: 퀴즈 평가 시스템 개선

## 역할
당신은 이 작업을 순차적으로 구현하는 에이전트입니다.
현재 파일의 작업 체크리스트를 확인하고, 첫 번째 미완료 챕터를 찾아 해당 챕터의 모든 항목을 진행하세요.

### 완료 표시
- 각 항목 완료 후 해당 체크박스를 [x]로 수정
- 챕터 내 모든 항목과 검증 항목 완료 후 다음 챕터로 진행

### 종료 조건
- 모든 체크박스가 [x]이면 → `<promise>ALL_TASKS_COMPLETED</promise>` 출력 후 종료

## 중요 규칙
1. **한 세션에 1개 챕터만 완료** (챕터 완료 후 세션 종료)
2. 반드시 README.md 체크박스 업데이트
3. 컴파일 오류 발생 시 해결 후 완료 처리
4. 챕터 완료 시 반드시 검증 항목(N.✓) 수행
5. 모든 작업 완료 시 `<promise>ALL_TASKS_COMPLETED</promise>` 출력

---

## 코드베이스 컨텍스트

### 프로젝트 구조
```
src/
├── index.ts              # GitQuiz 메인 클래스
├── cli.ts                # CLI 명령어 처리
├── quiz/
│   └── manager.ts        # 퀴즈 실행 및 답변 평가 (수정 대상)
├── providers/
│   ├── types.ts          # AIProvider 인터페이스 (수정 대상)
│   ├── openai.ts         # OpenAI 프로바이더 (수정 대상)
│   ├── anthropic.ts      # Anthropic 프로바이더 (수정 대상)
│   ├── ollama.ts         # Ollama 프로바이더 (수정 대상)
│   └── claude-code.ts    # Claude Code 프로바이더 (수정 대상)
├── analyzer/
│   └── complexity.ts     # 복잡도 분석
└── types/
    └── index.ts          # 타입 정의 (수정 대상)
```

### 기존 패턴
- **AI 프로바이더**: `AIProvider` 인터페이스 구현, `generateQuiz()` + `evaluateAnswer()` 메서드
- **입력 처리**: readline(서술형) + @inquirer/select(객관식) 혼용
- **타입 정의**: `Question.correctAnswer?` 필드 이미 존재 (활용 안 됨)

### 재사용 가능한 코드
- `Question` 인터페이스의 `correctAnswer` 필드
- 각 프로바이더의 `generateQuiz()` 프롬프트 구조

---

## 수정 대상 문제

### 문제 1: 객관식 문제의 불필요한 AI 평가
- **현상**: 객관식 답변도 매번 `evaluateAnswer()` API 호출
- **원인**: 정답이 이미 정해져 있는데 퀴즈 생성 시 활용 안 함
- **해결**: 퀴즈 생성 시 정답/피드백 포함, 객관식은 로컬에서 평가

### 문제 2: 객관식 후 서술형 입력 시 프롬프트 즉시 종료
- **현상**: 1번(객관식) 완료 후 2번(서술형)에서 `Your answer:` 표시 직후 종료
- **원인**: inquirer의 `select()`가 stdin을 조작한 후 복구 안 됨
- **해결**: stdin 명시적 resume 또는 process.stdin 재설정

---

## 작업 체크리스트

### 1. 타입 정의 확장
- [x] 1.1 `src/types/index.ts` 수정: `Question` 인터페이스에 객관식용 필드 추가
  - `correctChoiceLabel?: string` - 정답 선택지 라벨 (예: 'A', 'B')
  - `correctFeedback?: string` - 정답 시 피드백
  - `incorrectFeedback?: string` - 오답 시 피드백
- [x] 1.✓ 챕터 1 검증: `pnpm build` 실행하여 타입 오류 없음 확인

### 2. AI 프로바이더 퀴즈 생성 프롬프트 수정
- [x] 2.1 `src/providers/openai.ts` 수정: `generateQuiz()` 프롬프트에 객관식 정답/피드백 요청 추가
  - JSON 응답 포맷에 `correctChoiceLabel`, `correctFeedback`, `incorrectFeedback` 포함
- [x] 2.2 `src/providers/anthropic.ts` 수정: 동일하게 프롬프트 수정
- [x] 2.3 `src/providers/ollama.ts` 수정: 동일하게 프롬프트 수정
- [x] 2.4 `src/providers/claude-code.ts` 수정: 동일하게 프롬프트 수정
- [x] 2.✓ 챕터 2 검증: `pnpm build` 실행하여 컴파일 성공 확인

### 3. QuizManager 객관식 로컬 평가 구현
- [x] 3.1 `src/quiz/manager.ts` 수정: `evaluateMultipleChoice()` 메서드 추가
  - 사용자 답변과 `question.correctChoiceLabel` 비교
  - 정답/오답에 따라 `correctFeedback`/`incorrectFeedback` 반환
  - `EvaluationResult` 형식으로 반환 (score: 10 or 0)
- [x] 3.2 `src/quiz/manager.ts` 수정: `runQuiz()` 내 평가 로직 분기
  - `question.type === 'MULTIPLE_CHOICE'`이고 `correctChoiceLabel` 존재 시 → 로컬 평가
  - 그 외 → 기존 `provider.evaluateAnswer()` 호출
- [x] 3.✓ 챕터 3 검증: `pnpm build` 실행하여 컴파일 성공 확인

### 4. readline/inquirer stdin 충돌 해결
- [x] 4.1 `src/quiz/manager.ts` 수정: `getMultipleChoiceAnswer()` finally 블록 개선
  - `process.stdin.resume()` 호출 추가
  - stdin이 paused 상태인 경우 복구
- [x] 4.2 `src/quiz/manager.ts` 수정: `initReadline()` 메서드 개선
  - 기존 readline이 있으면 먼저 close
  - `process.stdin.resume()` 호출 후 새 인터페이스 생성
- [x] 4.✓ 챕터 4 검증: 수동 테스트 - 객관식 → 서술형 순서로 퀴즈 진행 시 입력 정상 동작 확인

### 5. 통합 테스트 및 정리
- [x] 5.1 `pnpm build` 실행하여 최종 빌드 성공 확인
- [x] 5.2 수동 테스트: `pnpm dev -- --provider claude-code --language ko` 실행
  - 객관식 문제 정답 선택 시 즉시 피드백 표시 (API 호출 없이)
  - 객관식 → 서술형 전환 시 입력 정상 동작
- [x] 5.✓ 챕터 5 검증: 모든 기능 정상 동작 확인
