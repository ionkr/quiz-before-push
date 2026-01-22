# Codebase Context: Gemini Provider 추가

## 프로젝트 구조

```
src/
├── providers/                 # AI 제공자 구현체들
│   ├── types.ts              # AIProvider 인터페이스 정의
│   ├── index.ts              # Provider factory 및 export
│   ├── openai.ts             # OpenAI 구현 (SDK 사용)
│   ├── anthropic.ts          # Anthropic 구현 (fetch 사용) ★ 참고
│   ├── ollama.ts             # Ollama 구현 (fetch 사용)
│   └── claude-code.ts        # Claude Code 구현 (CLI 사용)
├── types/
│   └── index.ts              # 핵심 타입 정의
├── cli.ts                    # CLI 진입점
└── index.ts                  # 메인 GitQuiz 클래스
```

## 핵심 인터페이스

### AIProvider (`src/providers/types.ts`)

```typescript
export interface AIProvider {
  generateQuiz(diff: string, complexity: number): Promise<Quiz>;
  evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult>;
  getName(): string;
}

export interface AIProviderConfig {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language?: string;
}
```

### Quiz 타입 (`src/types/index.ts`)

```typescript
interface Quiz {
  questions: Question[];
  complexity: ComplexityLevel;
  generatedAt: Date;
}

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  choices?: Choice[];
  correctAnswer?: string;
  correctChoiceLabel?: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  context?: string;
}

interface EvaluationResult {
  score: number;
  passed: boolean;
  feedback: string;
  correctAnswer?: string;
}
```

## 참고할 기존 코드

### 1. Anthropic Provider (`src/providers/anthropic.ts`)

Gemini와 가장 유사한 패턴 - **fetch API 사용**:

```typescript
// 라인 171-200: chat() 메서드 - HTTP 요청 패턴
private async chat(prompt: string): Promise<string> {
  const response = await fetch(`${this.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: this.model,
      max_tokens: 4096,
      system: 'You are a helpful assistant...',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  return data.content[0].text;
}
```

### 2. JSON 파싱 (`src/providers/anthropic.ts:202-212`)

```typescript
private parseJsonResponse<T>(content: string): T {
  let jsonStr = content.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  return JSON.parse(jsonStr) as T;
}
```

### 3. 복잡도 계산 (`src/providers/anthropic.ts:214-227`)

```typescript
private getComplexityLevel(complexity: number): string {
  if (complexity < 25) return 'LOW';
  if (complexity < 50) return 'MEDIUM';
  if (complexity < 75) return 'HIGH';
  return 'CRITICAL';
}

private getQuizCount(complexity: number): number {
  if (complexity < 20) return 1;
  if (complexity < 40) return 2;
  if (complexity < 60) return 3;
  if (complexity < 80) return 4;
  return 5;
}
```

### 4. Provider Factory (`src/providers/index.ts:16-49`)

```typescript
export function createProvider(options: ProviderOptions): AIProvider {
  switch (options.provider) {
    case 'anthropic':
      return new AnthropicProvider({
        model: options.model,
        apiKey: options.apiKey,
        language: options.language,
      });
    // ... other cases
  }
}
```

### 5. CLI 통합 (`src/cli.ts`)

- 라인 13: `provider` 타입 정의
- 라인 117-119: `--provider` 옵션 설명
- 라인 139-142: `getDefaultApiKey()` 함수
- 라인 154: `validProviders` 배열

## 수정 대상 파일 요약

| 파일 | 작업 |
|------|------|
| `src/providers/gemini.ts` | 신규 생성 |
| `src/providers/index.ts` | import, switch case, export 추가 |
| `src/cli.ts` | 타입, 옵션, 검증 배열 수정 |
| `.env.example` | GEMINI_API_KEY 추가 |

## Gemini vs Anthropic 차이점

| 항목 | Anthropic | Gemini |
|------|-----------|--------|
| 엔드포인트 | `/v1/messages` | `/v1beta/models/{model}:generateContent` |
| 인증 헤더 | `x-api-key` | `x-goog-api-key` |
| 요청 구조 | `messages: [{role, content}]` | `contents: [{parts: [{text}]}]` |
| 응답 추출 | `content[0].text` | `candidates[0].content.parts[0].text` |
| JSON 모드 | 프롬프트로 요청 | `responseMimeType` + `responseJsonSchema` |
