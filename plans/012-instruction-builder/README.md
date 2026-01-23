# 012: Instruction 생성 로직 공통화

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

- **Provider 목록**: anthropic, openai, gemini, ollama, claude-code (5개)
- **공통 의존성**: `ComplexityAnalyzer` (`src/analyzer/complexity.ts`)
- **타입 정의**: `src/types/index.ts`, `src/providers/types.ts`
- **중복 코드 위치**:
  - `generateQuiz` prompt: 각 provider 41-90줄 범위
  - `evaluateAnswer` prompt: 각 provider 124-172줄 범위
  - `parseJsonResponse`: anthropic, gemini, ollama, claude-code에서 동일

---

## 변경 개요

### 현재 상태
```
각 Provider에서 동일한 instruction 생성 로직 중복 (약 70줄 x 5개 = 350줄)
```

### 변경 후 상태
```
InstructionBuilder 클래스로 공통화 → 각 Provider는 API 호출만 담당
```

---

## 작업 체크리스트

### 1. InstructionBuilder 클래스 생성
- [x] 1.1 `src/providers/instruction-builder.ts` 생성: 기본 클래스 구조 및 타입 import
- [x] 1.2 `src/providers/instruction-builder.ts` 수정: `buildLanguageInstruction(language?: string, forEvaluation?: boolean): string` static 메서드 추가
- [x] 1.3 `src/providers/instruction-builder.ts` 수정: `buildHintInstruction(attemptCount: number, maxAttempts: number): string` static 메서드 추가
- [x] 1.4 `src/providers/instruction-builder.ts` 수정: `buildQuizPrompt(params)` static 메서드 추가 - generateQuiz용 전체 prompt 생성
- [x] 1.5 `src/providers/instruction-builder.ts` 수정: `buildEvaluationPrompt(params)` static 메서드 추가 - evaluateAnswer용 전체 prompt 생성
- [x] 1.6 `src/providers/instruction-builder.ts` 수정: `parseJsonResponse<T>(content: string): T` static 메서드 추가 - 마크다운 코드블록 제거 및 JSON 파싱
- [x] 1.7 `src/providers/instruction-builder.ts` 수정: `RawQuizResponse`, `RawEvaluationResponse` 타입 정의 및 export
- [x] 1.8 `src/providers/instruction-builder.ts` 수정: `buildQuizFromResponse(parsed, complexityLevel): Quiz` static 메서드 추가
- [x] 1.9 `src/providers/instruction-builder.ts` 수정: `buildEvaluationFromResponse(parsed): EvaluationResult` static 메서드 추가
- [x] 1.✓ 챕터 1 검증 (chapter-verifier agent 호출)
  - 검증 대상: `src/providers/instruction-builder.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: InstructionBuilder 클래스가 모든 static 메서드 포함, 타입 오류 없음

### 2. Anthropic Provider 리팩토링
- [x] 2.1 `src/providers/anthropic.ts` 수정: `InstructionBuilder` import 추가
- [x] 2.2 `src/providers/anthropic.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.buildQuizPrompt()` 사용
- [x] 2.3 `src/providers/anthropic.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildQuizFromResponse()` 사용
- [x] 2.4 `src/providers/anthropic.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.buildEvaluationPrompt()` 사용
- [x] 2.5 `src/providers/anthropic.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildEvaluationFromResponse()` 사용
- [x] 2.6 `src/providers/anthropic.ts` 수정: 로컬 `parseJsonResponse` private 메서드 삭제
- [x] 2.✓ 챕터 2 검증 (chapter-verifier agent 호출)
  - 검증 대상: `src/providers/anthropic.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: 중복 코드 제거, InstructionBuilder 활용, 빌드 성공

### 3. OpenAI Provider 리팩토링
- [x] 3.1 `src/providers/openai.ts` 수정: `InstructionBuilder` import 추가
- [x] 3.2 `src/providers/openai.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.buildQuizPrompt()` 사용
- [x] 3.3 `src/providers/openai.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.buildQuizFromResponse()` 사용 (OpenAI는 response_format 사용하므로 parseJsonResponse 직접 사용 가능)
- [x] 3.4 `src/providers/openai.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.buildEvaluationPrompt()` 사용
- [x] 3.5 `src/providers/openai.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.buildEvaluationFromResponse()` 사용
- [x] 3.✓ 챕터 3 검증 (chapter-verifier agent 호출)
  - 검증 대상: `src/providers/openai.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: 중복 코드 제거, InstructionBuilder 활용, 빌드 성공

### 4. Gemini Provider 리팩토링
- [x] 4.1 `src/providers/gemini.ts` 수정: `InstructionBuilder` import 추가
- [x] 4.2 `src/providers/gemini.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.buildQuizPrompt()` 사용
- [x] 4.3 `src/providers/gemini.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildQuizFromResponse()` 사용
- [x] 4.4 `src/providers/gemini.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.buildEvaluationPrompt()` 사용
- [x] 4.5 `src/providers/gemini.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildEvaluationFromResponse()` 사용
- [x] 4.6 `src/providers/gemini.ts` 수정: 로컬 `parseJsonResponse` private 메서드 삭제
- [x] 4.✓ 챕터 4 검증 (chapter-verifier agent 호출)
  - 검증 대상: `src/providers/gemini.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: 중복 코드 제거, InstructionBuilder 활용, 빌드 성공

### 5. Ollama Provider 리팩토링
- [x] 5.1 `src/providers/ollama.ts` 수정: `InstructionBuilder` import 추가
- [x] 5.2 `src/providers/ollama.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.buildQuizPrompt()` 사용
- [x] 5.3 `src/providers/ollama.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildQuizFromResponse()` 사용
- [x] 5.4 `src/providers/ollama.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.buildEvaluationPrompt()` 사용
- [x] 5.5 `src/providers/ollama.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildEvaluationFromResponse()` 사용
- [x] 5.6 `src/providers/ollama.ts` 수정: 로컬 `parseJsonResponse` private 메서드 삭제
- [x] 5.✓ 챕터 5 검증 (chapter-verifier agent 호출)
  - 검증 대상: `src/providers/ollama.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: 중복 코드 제거, InstructionBuilder 활용, 빌드 성공

### 6. Claude-Code Provider 리팩토링
- [x] 6.1 `src/providers/claude-code.ts` 수정: `InstructionBuilder` import 추가
- [x] 6.2 `src/providers/claude-code.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.buildQuizPrompt()` 사용
- [x] 6.3 `src/providers/claude-code.ts` 수정: `generateQuiz` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildQuizFromResponse()` 사용
- [x] 6.4 `src/providers/claude-code.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.buildEvaluationPrompt()` 사용
- [x] 6.5 `src/providers/claude-code.ts` 수정: `evaluateAnswer` 메서드에서 `InstructionBuilder.parseJsonResponse()` 및 `buildEvaluationFromResponse()` 사용
- [x] 6.6 `src/providers/claude-code.ts` 수정: 로컬 `parseJsonResponse` private 메서드 삭제
- [x] 6.✓ 챕터 6 검증 (chapter-verifier agent 호출)
  - 검증 대상: `src/providers/claude-code.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: 중복 코드 제거, InstructionBuilder 활용, 빌드 성공

### 7. 최종 검증 및 정리
- [x] 7.1 전체 빌드 검증: `npm run build` 실행
- [x] 7.2 코드 리뷰: 각 provider에서 중복 코드가 모두 제거되었는지 확인
- [x] 7.3 기능 검증: InstructionBuilder의 각 메서드가 기존 로직과 동일한 결과를 생성하는지 확인
- [x] 7.✓ 챕터 7 검증 (chapter-verifier agent 호출)
  - 검증 대상: 모든 provider 파일 및 `instruction-builder.ts`
  - 검증 명령어: `npm run build`
  - 요구사항: 빌드 성공, 중복 코드 완전 제거

---

## 참고 파일

| 파일 | 역할 | 수정 내용 |
|------|------|----------|
| `src/providers/instruction-builder.ts` | **신규** | InstructionBuilder 클래스 |
| `src/providers/anthropic.ts` | Anthropic API | InstructionBuilder 사용으로 리팩토링 |
| `src/providers/openai.ts` | OpenAI SDK | InstructionBuilder 사용으로 리팩토링 |
| `src/providers/gemini.ts` | Gemini API | InstructionBuilder 사용으로 리팩토링 |
| `src/providers/ollama.ts` | Ollama local | InstructionBuilder 사용으로 리팩토링 |
| `src/providers/claude-code.ts` | Claude CLI | InstructionBuilder 사용으로 리팩토링 |

---

## InstructionBuilder 상세 설계

### 타입 정의

```typescript
export interface QuizPromptParams {
  quizCount: number;
  complexityLevel: string;
  language?: string;
  diff: string;
}

export interface EvaluationPromptParams {
  question: Question;
  answer: string;
  attemptCount: number;
  maxAttempts: number;
  language?: string;
}

export interface RawQuizResponse {
  questions: Array<{
    id: string;
    type: string;
    question: string;
    choices?: Array<{ label: string; text: string }>;
    correctAnswer?: string;
    correctChoiceLabel?: string;
    correctFeedback?: string;
    incorrectFeedback?: string;
    context?: string;
  }>;
}

export interface RawEvaluationResponse {
  score: number;
  passed: boolean;
  feedback: string;
  hint?: string | null;
  correctAnswer?: string | null;
}
```

### Static 메서드 목록

| 메서드 | 입력 | 출력 | 설명 |
|--------|------|------|------|
| `buildLanguageInstruction` | `language?, forEvaluation?` | `string` | 언어 instruction 생성 |
| `buildHintInstruction` | `attemptCount, maxAttempts` | `string` | 힌트 수준 instruction 생성 |
| `buildQuizPrompt` | `QuizPromptParams` | `string` | Quiz 생성용 전체 prompt |
| `buildEvaluationPrompt` | `EvaluationPromptParams` | `string` | 답변 평가용 전체 prompt |
| `parseJsonResponse` | `string` | `T` | JSON 파싱 (마크다운 제거) |
| `buildQuizFromResponse` | `RawQuizResponse, complexityLevel` | `Quiz` | Quiz 객체 생성 |
| `buildEvaluationFromResponse` | `RawEvaluationResponse` | `EvaluationResult` | EvaluationResult 객체 생성 |
