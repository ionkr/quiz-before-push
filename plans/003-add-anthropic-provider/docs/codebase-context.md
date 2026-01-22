# 코드베이스 분석 결과

## 프로젝트 개요
Git Quiz는 Git 커밋 전 코드 변경사항에 대한 퀴즈를 생성하여 코드 리뷰 품질을 높이는 CLI 도구입니다.

## 디렉토리 구조
```
/Users/luke/review-before-go/
├── src/
│   ├── providers/           # AI 프로바이더 구현
│   │   ├── types.ts        # AIProvider, AIProviderConfig 인터페이스
│   │   ├── index.ts        # createProvider 팩토리 함수
│   │   ├── openai.ts       # OpenAI 프로바이더 (참고용)
│   │   ├── ollama.ts       # Ollama 프로바이더 (JSON 추출 참고)
│   │   └── claude-code.ts  # Claude Code CLI 프로바이더
│   ├── types/index.ts      # Quiz, Question, EvaluationResult 타입
│   ├── analyzer/complexity.ts  # 복잡도 분석
│   ├── quiz/manager.ts     # 퀴즈 실행 관리
│   ├── cli.ts              # CLI 진입점
│   └── index.ts            # GitQuiz 메인 클래스
├── dist/                    # 빌드 출력
├── package.json
├── tsconfig.json
└── .env.example
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
export interface Quiz {
  questions: Question[];
}

export interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'FREE_TEXT';
  question: string;
  choices?: { label: string; text: string }[];
  correctAnswer: string;
  context?: string;
}

export interface EvaluationResult {
  score: number;      // 0-10
  passed: boolean;    // score >= 7
  feedback: string;
  correctAnswer: string;
}
```

## 프로바이더 팩토리 (`src/providers/index.ts`)
```typescript
export interface ProviderOptions {
  provider: 'openai' | 'ollama' | 'claude-code';  // 'anthropic' 추가 필요
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
}

export function createProvider(options: ProviderOptions): AIProvider {
  switch (options.provider) {
    case 'openai':
      return new OpenAIProvider({...});
    case 'ollama':
      return new OllamaProvider({...});
    case 'claude-code':
      return new ClaudeCodeProvider({...});
    default:
      throw new Error(`Unknown provider: ${options.provider}`);
  }
}
```

## 재사용 패턴

### 복잡도 레벨 계산
```typescript
private getComplexityLevel(complexity: number): string {
  if (complexity < 25) return 'LOW';
  if (complexity < 50) return 'MEDIUM';
  if (complexity < 75) return 'HIGH';
  return 'CRITICAL';
}
```

### 질문 개수 계산
```typescript
private getQuizCount(complexity: number): number {
  if (complexity < 20) return 1;
  if (complexity < 40) return 2;
  if (complexity < 60) return 3;
  if (complexity < 80) return 4;
  return 5;
}
```

### JSON 추출 (Ollama 패턴)
```typescript
private extractJson<T>(content: string): T {
  let jsonStr = content;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  jsonStr = jsonStr.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
  return JSON.parse(jsonStr) as T;
}
```

### 퀴즈 생성 프롬프트 구조
```
시스템: "You are a code review quiz generator. Always respond with valid JSON."

사용자:
- Complexity level: {level}
- Number of questions: {count}
- Language instruction
- Git Diff
- JSON 형식 명세
```

### 답변 평가 프롬프트 구조
```
- 0-10 점수
- 7점 이상: 통과
- 피드백 및 정답 포함
```

## CLI 통합 (`src/cli.ts`)
```typescript
interface GitQuizCliOptions {
  provider: 'openai' | 'ollama' | 'claude-code';  // 'anthropic' 추가 필요
  model?: string;
  apiKey?: string;
  // ...
}
```

- `--provider` 옵션으로 프로바이더 선택
- 환경변수 우선순위: CLI > Git Config > 환경변수 > 기본값

## 수정 대상 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `package.json` | `@anthropic-ai/sdk` 의존성 추가 |
| `.env.example` | `ANTHROPIC_API_KEY` 추가 |
| `src/providers/anthropic.ts` | **새 파일** - AnthropicProvider 구현 |
| `src/providers/index.ts` | 프로바이더 팩토리에 anthropic 추가 |
| `src/cli.ts` | CLI 옵션에 anthropic 추가 |
| 프로젝트 `README.md` | Anthropic 사용법 문서화 |
