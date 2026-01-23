# 011: 점진적 힌트 시스템

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

- **평가 흐름**: `manager.ts:runQuiz()` → `provider.evaluateAnswer()` → `EvaluationResult` 반환
- **현재 retry 로직**: `manager.ts:150-193` - 문제별 while 루프, 3회 실패 시 전체 퀴즈 실패
- **Provider 목록**: anthropic, openai, gemini, ollama, claude-code (5개)
- **평가 프롬프트**: 각 provider의 `evaluateAnswer()` 메서드 내 정의

---

## 변경 개요

### 현재 동작
```
문제1 오답 → 정답 공개 → 재시도 → 3회 실패 시 전체 퀴즈 실패
```

### 변경 후 동작
```
문제1 오답 → 힌트1 → 오답 → 힌트2 → 오답 → 정답 공개 → 문제2로 이동
...
전체 퀴즈 종료 → 정답률로 통과 판정 (60% 이상)
```

---

## 작업 체크리스트

### 1. 타입 정의 확장
- [x] 1.1 `src/types/index.ts` 수정: `EvaluationResult` 인터페이스에 `hint?: string` 필드 추가
- [x] 1.2 `attemptCount`는 provider 호출 시 파라미터로 전달 (EvaluationResult에는 불필요)
- [x] 1.✓ 챕터 1 검증: `npm run build` 성공 확인

### 2. Provider 인터페이스 확장
- [x] 2.1 `src/providers/types.ts` 수정: `evaluateAnswer` 메서드에 `attemptCount?: number`, `maxAttempts?: number` 파라미터 추가
- [x] 2.✓ 챕터 2 검증: `npm run build` 성공 확인

### 3. Provider 평가 로직 수정 (Anthropic)
- [x] 3.1 `src/providers/anthropic.ts` 수정: `evaluateAnswer` 메서드에 `attemptCount`, `maxAttempts` 파라미터 추가
- [x] 3.2 `src/providers/anthropic.ts` 수정: 평가 프롬프트에 힌트 생성 지침 추가
- [x] 3.3 `src/providers/anthropic.ts` 수정: JSON 응답 정의에 `hint` 필드 추가
- [x] 3.4 `src/providers/anthropic.ts` 수정: 응답 파싱에서 `hint` 필드 반환
- [x] 3.✓ 챕터 3 검증: `npm run build` 성공 확인

### 4. Provider 평가 로직 수정 (OpenAI)
- [x] 4.1 `src/providers/openai.ts` 수정: `evaluateAnswer` 메서드에 `attemptCount`, `maxAttempts` 파라미터 추가
- [x] 4.2 `src/providers/openai.ts` 수정: 평가 프롬프트에 힌트 생성 지침 추가
- [x] 4.3 `src/providers/openai.ts` 수정: JSON 응답 정의에 `hint` 필드 추가
- [x] 4.4 `src/providers/openai.ts` 수정: 응답 파싱에서 `hint` 필드 반환
- [x] 4.✓ 챕터 4 검증: `npm run build` 성공 확인

### 5. Provider 평가 로직 수정 (Gemini)
- [x] 5.1 `src/providers/gemini.ts` 수정: `evaluateAnswer` 메서드에 `attemptCount`, `maxAttempts` 파라미터 추가
- [x] 5.2 `src/providers/gemini.ts` 수정: 평가 프롬프트에 힌트 생성 지침 추가
- [x] 5.3 `src/providers/gemini.ts` 수정: JSON 스키마에 `hint` 필드 추가
- [x] 5.4 `src/providers/gemini.ts` 수정: 응답 파싱에서 `hint` 필드 반환
- [x] 5.✓ 챕터 5 검증: `npm run build` 성공 확인

### 6. Provider 평가 로직 수정 (Ollama)
- [x] 6.1 `src/providers/ollama.ts` 수정: `evaluateAnswer` 메서드에 `attemptCount`, `maxAttempts` 파라미터 추가
- [x] 6.2 `src/providers/ollama.ts` 수정: 평가 프롬프트에 힌트 생성 지침 추가
- [x] 6.3 `src/providers/ollama.ts` 수정: JSON 응답 정의에 `hint` 필드 추가
- [x] 6.4 `src/providers/ollama.ts` 수정: 응답 파싱에서 `hint` 필드 반환
- [x] 6.✓ 챕터 6 검증: `npm run build` 성공 확인

### 7. Provider 평가 로직 수정 (Claude-Code)
- [x] 7.1 `src/providers/claude-code.ts` 수정: `evaluateAnswer` 메서드에 `attemptCount`, `maxAttempts` 파라미터 추가
- [x] 7.2 `src/providers/claude-code.ts` 수정: 평가 프롬프트에 힌트 생성 지침 추가
- [x] 7.3 `src/providers/claude-code.ts` 수정: JSON 응답 정의에 `hint` 필드 추가
- [x] 7.4 `src/providers/claude-code.ts` 수정: 응답 파싱에서 `hint` 필드 반환
- [x] 7.✓ 챕터 7 검증: `npm run build` 성공 확인

### 8. QuizManager 힌트 표시 로직
- [x] 8.1 `src/quiz/manager.ts` 수정: `displayEvaluation` 메서드에서 오답 시 hint 표시 (correctAnswer 대신)
- [x] 8.2 `src/quiz/manager.ts` 수정: 마지막 시도(isLastAttempt)일 때만 correctAnswer 표시
- [x] 8.3 `src/quiz/manager.ts` 수정: 힌트 표시 스타일 개선 (chalk.cyan 💡)
- [x] 8.✓ 챕터 8 검증: `npm run build` 성공 확인

### 9. QuizManager 흐름 로직 수정
- [x] 9.1 `src/quiz/manager.ts` 수정: retry 루프에서 `evaluateAnswer` 호출 시 `attemptCount`, `maxAttempts` 전달
- [x] 9.2 `src/quiz/manager.ts` 수정: 3회 시도 후 정답 공개하고 **다음 문제로 자동 진행**
- [x] 9.3 `src/quiz/manager.ts` 수정: `attemptCount`를 문제별로 관리
- [x] 9.4 `src/quiz/manager.ts` 수정: 전체 퀴즈 종료 후 정답률로 통과 판정 (60% 이상)
- [x] 9.5 `src/quiz/manager.ts` 수정: 로컬 평가(객관식)는 힌트 없이 재시도, 마지막 시도에만 정답 공개
- [x] 9.✓ 챕터 9 검증: `npm run build` 성공 확인

### 10. 최종 검증 및 버전 업
- [x] 10.1 `package.json` 수정: 버전을 `0.1.4` → `0.1.5`로 패치 업
- [x] 10.2 `npm run build` 실행하여 최종 빌드 성공 확인
- [x] 10.3 코드 리뷰 완료: 힌트 시스템 로직 검증
- [x] 10.✓ 챕터 10 검증: 모든 기능 정상 동작 확인

---

## 힌트 프롬프트 가이드라인

Provider 프롬프트에 추가할 힌트 생성 지침:

```
HINT GENERATION (when answer is incorrect):
Based on the attempt count, provide appropriate guidance:

- Attempt 1-2: Provide a directional hint
  - Guide the developer toward the right thinking approach
  - Example: "Consider what type of validation this function performs"
  - Do NOT reveal the answer

- Attempt 3+: Provide the correct answer with detailed explanation
  - Reveal the correct answer
  - Explain why it's correct
  - Reference specific code changes if relevant

Include "hint" field in JSON response (null if answer is correct).
```

---

## 참고 파일

| 파일 | 역할 | 주요 수정 위치 |
|------|------|---------------|
| `src/types/index.ts` | 타입 정의 | `EvaluationResult` 인터페이스 (37-42줄) |
| `src/providers/types.ts` | Provider 인터페이스 | `evaluateAnswer` 메서드 시그니처 |
| `src/providers/anthropic.ts` | Anthropic 평가 | `evaluateAnswer` (124-172줄) |
| `src/providers/openai.ts` | OpenAI 평가 | `evaluateAnswer` (125-189줄) |
| `src/providers/gemini.ts` | Gemini 평가 | `evaluateAnswer` (173-221줄) |
| `src/providers/ollama.ts` | Ollama 평가 | `evaluateAnswer` (122-170줄) |
| `src/providers/claude-code.ts` | Claude-Code 평가 | `evaluateAnswer` (102-150줄) |
| `src/quiz/manager.ts` | 퀴즈 관리 | retry 루프 (150-193줄), displayEvaluation (301-311줄) |
