# Anthropic 프로바이더 추가

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
├── providers/           # AI 프로바이더 구현
│   ├── types.ts        # AIProvider 인터페이스
│   ├── index.ts        # 프로바이더 팩토리 (createProvider)
│   ├── openai.ts       # OpenAI 구현 (참고용)
│   ├── ollama.ts       # Ollama 구현 (참고용)
│   └── claude-code.ts  # Claude Code CLI 구현
├── types/index.ts      # Quiz, Question, EvaluationResult 타입
├── cli.ts              # CLI 명령어 처리
└── index.ts            # GitQuiz 메인 클래스
```

### 재사용 가능한 패턴
- **프로바이더 인터페이스**: `src/providers/types.ts`의 `AIProvider` 인터페이스 구현
- **프롬프트 구조**: `src/providers/openai.ts`의 시스템/사용자 메시지 패턴 동일 적용
- **JSON 파싱**: 마크다운 코드블록 제거 후 JSON.parse (Ollama 패턴 참고)
- **복잡도 계산**: `getComplexityLevel()`, `getQuizCount()` 메서드 동일 구현

### 기존 프로바이더
- `openai`: OpenAI SDK 사용, `response_format: { type: 'json_object' }` 지원
- `ollama`: HTTP 기반, 로컬 실행, JSON 추출 유틸리티 포함
- `claude-code`: CLI 프로세스 실행 방식

---

## 작업 체크리스트

### 1. 환경 설정
- [x] 1.1 `.env.example` 수정: `ANTHROPIC_API_KEY` 환경변수 예시 추가
- [x] 1.✓ 챕터 1 검증: `.env.example` 파일에 `ANTHROPIC_API_KEY` 존재 확인

### 2. Anthropic 프로바이더 구현 (fetch 기반)
- [x] 2.1 `src/providers/anthropic.ts` 생성: AnthropicProvider 클래스 구현
  - `AIProvider` 인터페이스 구현
  - `node-fetch`로 Anthropic Messages API 직접 호출 (Ollama 패턴 참고)
  - API 엔드포인트: `https://api.anthropic.com/v1/messages`
  - 헤더: `x-api-key`, `anthropic-version: 2023-06-01`
  - 기본 모델: `claude-sonnet-4-20250514`
  - `generateQuiz()`: 퀴즈 생성 메서드
  - `evaluateAnswer()`: 답변 평가 메서드
  - `getName()`: 'anthropic' 반환
  - `getComplexityLevel()`, `getQuizCount()`: OpenAI와 동일 로직
  - JSON 응답 파싱: Ollama 패턴 참고 (마크다운 코드블록 제거)
- [x] 2.✓ 챕터 2 검증: TypeScript 컴파일 오류 없음 확인 (`pnpm build` 또는 `npx tsc --noEmit`)

### 3. 프로바이더 팩토리 연동
- [x] 3.1 `src/providers/index.ts` 수정:
  - `AnthropicProvider` import 추가
  - `ProviderOptions` 타입에 `'anthropic'` 추가
  - `createProvider()` switch문에 `'anthropic'` 케이스 추가
  - exports에 `AnthropicProvider` 추가
- [x] 3.2 `src/providers/types.ts` 확인: 필요시 `AIProviderConfig`에 anthropic 관련 설정 추가
- [x] 3.✓ 챕터 3 검증: `pnpm build` 성공 확인

### 4. CLI 통합
- [x] 4.1 `src/cli.ts` 수정:
  - `GitQuizCliOptions.provider` 타입에 `'anthropic'` 추가
  - `--provider` 옵션 choices에 `'anthropic'` 추가
  - 프로바이더 검증 배열에 `'anthropic'` 추가
  - Anthropic API 키 처리 로직 추가 (`ANTHROPIC_API_KEY` 환경변수)
- [x] 4.✓ 챕터 4 검증: `pnpm build && node dist/cli.js --help`로 anthropic 옵션 확인

### 5. 테스트 및 문서화
- [x] 5.1 `ANTHROPIC_API_KEY` 환경변수 설정 후 실제 동작 테스트
  - `node dist/cli.js --provider anthropic` 실행
  - 퀴즈 생성 및 답변 평가 정상 동작 확인
- [x] 5.2 `README.md`(프로젝트 루트) 수정: Anthropic 프로바이더 사용법 문서화
  - 환경변수 설정 방법
  - CLI 사용 예시
- [x] 5.✓ 챕터 5 검증: 전체 기능 정상 동작 확인

---

## 참고 문서
- [Anthropic SDK 공식 문서](https://docs.anthropic.com/en/api/client-sdks)
- 기존 구현: `src/providers/openai.ts` (가장 유사한 패턴)
- 타입 정의: `src/providers/types.ts`
