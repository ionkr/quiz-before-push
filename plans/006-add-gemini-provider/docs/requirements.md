# Requirements: Gemini Provider 추가

## 목표

Google Gemini를 review-before-go의 새로운 AI provider로 추가합니다.

## 핵심 요구사항

### 1. 기술 스택

| 항목 | 선택 |
|------|------|
| HTTP 클라이언트 | `fetch` API (Node.js 내장) |
| SDK | 사용 안함 |
| 기본 모델 | `gemini-3-flash-preview` |
| JSON 모드 | `responseJsonSchema` 사용 |

### 2. 기능 요구사항

- `AIProvider` 인터페이스 완전 구현
  - `generateQuiz(diff: string, complexity: number): Promise<Quiz>`
  - `evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult>`
  - `getName(): string`

- 기존 provider와 동일한 동작
  - 동일한 프롬프트 구조
  - 동일한 복잡도 계산 로직
  - 동일한 퀴즈 개수 결정 로직

### 3. 설정

- 환경변수: `GEMINI_API_KEY`
- CLI 옵션: `--provider gemini`
- 기본 URL: `https://generativelanguage.googleapis.com/v1beta`

### 4. JSON Schema 사용

응답 안정성을 위해 `responseJsonSchema` 설정:

```json
{
  "generationConfig": {
    "responseMimeType": "application/json",
    "responseJsonSchema": {
      "type": "object",
      "properties": {
        "questions": {
          "type": "array",
          "items": { ... }
        }
      },
      "required": ["questions"]
    }
  }
}
```

## 비기능 요구사항

- 기존 코드 패턴과 일관성 유지
- 타입 안전성 보장 (TypeScript strict mode)
- 에러 메시지 명확하게 제공
