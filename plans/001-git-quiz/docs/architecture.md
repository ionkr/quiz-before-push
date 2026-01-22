# git-quiz 아키텍처 설계

## 1. 디렉토리 구조

```
git-quiz/
├── src/
│   ├── cli.ts                    # CLI 엔트리포인트 (Commander.js)
│   ├── index.ts                  # GitQuiz 메인 클래스
│   ├── types/
│   │   └── index.ts              # 공통 타입 정의
│   ├── providers/
│   │   ├── types.ts              # AIProvider 인터페이스
│   │   ├── index.ts              # 프로바이더 팩토리
│   │   ├── openai.ts             # OpenAI 프로바이더
│   │   ├── ollama.ts             # Ollama 프로바이더
│   │   └── claude-code.ts        # Claude Code 프로바이더
│   ├── analyzer/
│   │   └── complexity.ts         # 복잡도 분석기
│   ├── quiz/
│   │   └── manager.ts            # 퀴즈 매니저
│   └── utils/
│       ├── git.ts                # Git 유틸리티
│       ├── redact.ts             # 민감 데이터 제거
│       └── config.ts             # 설정 로더
├── hooks/
│   ├── pre-push                  # Unix용 Git 훅
│   ├── pre-push.bat              # Windows용 Git 훅
│   └── README.md                 # 훅 사용 설명서
├── claude-hook/
│   ├── settings.json             # Claude Code 훅 설정 예시
│   └── quiz-hook.sh              # 훅 실행 스크립트
├── docs/
│   ├── API.md                    # API 문서
│   └── SECURITY.md               # 보안 문서
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── QUICK_START.md
```

---

## 2. 핵심 컴포넌트

### 2.1 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│                      (src/cli.ts)                            │
│  Commander.js 기반 옵션 파싱, 설정 로딩                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Layer                       │
│                     (src/index.ts)                           │
│  GitQuiz 클래스: 전체 플로우 조율                             │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│   Analyzer   │  │ QuizManager  │  │      Provider Layer      │
│  복잡도 분석  │  │  퀴즈 실행   │  │  (src/providers/*.ts)    │
└──────────────┘  └──────────────┘  │  ┌────────┐ ┌────────┐   │
                                    │  │OpenAI  │ │Ollama  │   │
                                    │  └────────┘ └────────┘   │
                                    │  ┌──────────────────┐    │
                                    │  │  Claude Code     │    │
                                    │  └──────────────────┘    │
                                    └──────────────────────────┘
```

### 2.2 데이터 플로우

```
[Git diff]
    │
    ▼
[ComplexityAnalyzer]
    │ 복잡도 점수, 퀴즈 개수, 난이도
    ▼
[AIProvider.generateQuiz()]
    │ Quiz 객체 (질문 배열)
    ▼
[QuizManager.runQuiz()]
    │ 사용자 응답 수집
    ▼
[AIProvider.evaluateAnswer()]
    │ EvaluationResult (점수, 피드백)
    ▼
[GitQuiz.run()]
    │ 최종 결과 (통과/실패)
    ▼
[Exit Code: 0 또는 1]
```

---

## 3. 인터페이스 설계

### 3.1 AIProvider 인터페이스

```typescript
// src/providers/types.ts
interface AIProvider {
  generateQuiz(diff: string, config: QuizConfig): Promise<Quiz>;
  evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult>;
  getName(): string;
}

interface QuizConfig {
  complexity: ComplexityLevel;
  questionCount: number;
  language?: string;  // 오버라이드 언어
}
```

### 3.2 Quiz 타입

```typescript
// src/types/index.ts
interface Quiz {
  questions: Question[];
  metadata: {
    complexity: ComplexityLevel;
    generatedAt: Date;
    provider: string;
  };
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'natural_language';
  text: string;
  options?: string[];         // 객관식인 경우
  correctAnswer?: string;     // 객관식 정답
  context: string;            // 관련 코드 조각
}

interface EvaluationResult {
  isCorrect: boolean;
  score: number;              // 0-10
  feedback: string;
  explanation?: string;       // 정답 설명
}
```

### 3.3 ComplexityLevel

```typescript
enum ComplexityLevel {
  LOW = 1,       // 1-2개 퀴즈, 쉬운 난이도
  MEDIUM = 2,    // 2-3개 퀴즈, 보통 난이도
  HIGH = 3,      // 3-4개 퀴즈, 어려운 난이도
  CRITICAL = 4   // 4-5개 퀴즈, 매우 어려운 난이도
}
```

---

## 4. 복잡도 분석 알고리즘

### 4.1 복잡도 계산 요소

| 요소 | 가중치 | 설명 |
|------|--------|------|
| 변경 라인 수 | 1x | 추가/삭제된 라인 수 |
| 변경 파일 수 | 2x | 영향받는 파일 수 |
| 함수/메서드 변경 | 3x | 함수 시그니처 변경 |
| 클래스 변경 | 4x | 클래스 구조 변경 |
| 타입 정의 변경 | 3x | 인터페이스/타입 변경 |
| 의존성 변경 | 5x | import/require 변경 |

### 4.2 복잡도 점수 → 레벨 매핑

```
점수 0-10:   LOW      → 퀴즈 1개
점수 11-25:  MEDIUM   → 퀴즈 2-3개
점수 26-50:  HIGH     → 퀴즈 3-4개
점수 51+:    CRITICAL → 퀴즈 4-5개
```

---

## 5. 퀴즈 생성 프롬프트 설계

### 5.1 시스템 프롬프트

```
You are a code review quiz generator. Your task is to create quiz questions
that test whether a developer truly understands the code changes they're
about to commit.

Rules:
1. Focus on the "why" and "what", not trivial syntax details
2. Multiple choice questions should have 4 options with 1 correct answer
3. Natural language questions should require explanation of logic or purpose
4. Questions should be answerable by someone who understands the code
5. Difficulty should match the complexity level provided
```

### 5.2 사용자 프롬프트 구조

```
Complexity Level: {level}
Number of Questions: {count}
{language ? `Generate questions in: ${language}` : ''}

Code Changes (diff):
```diff
{sanitized_diff}
```

Generate a quiz with the specified number of questions.
Mix multiple choice and natural language questions.
Return as JSON with the following structure:
{
  "questions": [...]
}
```

---

## 6. 설정 우선순위

```
1. CLI 옵션 (최우선)
2. 환경 변수
3. Git Config (로컬)
4. Git Config (전역)
5. 기본값
```

### 6.1 설정 로딩 예시

```typescript
function loadConfig(cliOptions: CLIOptions): Config {
  return {
    provider:
      cliOptions.provider ??
      process.env.GIT_QUIZ_PROVIDER ??
      getGitConfig('quiz.provider') ??
      'openai',

    language:
      cliOptions.language ??
      process.env.GIT_QUIZ_LANGUAGE ??
      getGitConfig('quiz.language') ??
      undefined,  // undefined = 자동 감지

    // ...
  };
}
```

---

## 7. 에러 처리 전략

### 7.1 에러 타입

```typescript
class QuizError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recoverable: boolean = false
  ) {
    super(message);
  }
}

enum ErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  PROVIDER_CONNECTION_FAILED = 'PROVIDER_CONNECTION_FAILED',
  QUIZ_GENERATION_FAILED = 'QUIZ_GENERATION_FAILED',
  EVALUATION_FAILED = 'EVALUATION_FAILED',
  GIT_ERROR = 'GIT_ERROR',
  CONFIG_INVALID = 'CONFIG_INVALID',
}
```

### 7.2 재시도 정책

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,  // 1초
  backoffMultiplier: 2,
  maxDelay: 10000,     // 10초
};
```

---

## 8. 보안 고려사항

### 8.1 민감 데이터 제거 패턴

```typescript
const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/g,           // OpenAI API 키
  /ghp_[a-zA-Z0-9]{36}/g,           // GitHub 토큰
  /AKIA[A-Z0-9]{16}/g,              // AWS 액세스 키
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /-----BEGIN.*PRIVATE KEY-----/g,
  // ... 더 많은 패턴
];
```

### 8.2 동의 메커니즘

```typescript
async function checkRemoteAPIConsent(provider: string): Promise<boolean> {
  if (provider === 'ollama') return true;  // 로컬은 동의 불필요

  console.log('⚠️  This will send code to remote API');
  console.log('   - File names');
  console.log('   - Code diff (sensitive data redacted)');

  return await askConfirmation('Do you consent?');
}
```

---

## 9. 확장 포인트

### 9.1 새 프로바이더 추가

```typescript
// 1. src/providers/custom.ts 생성
export class CustomProvider implements AIProvider {
  async generateQuiz(diff: string, config: QuizConfig): Promise<Quiz> {
    // 구현
  }

  async evaluateAnswer(question: Question, answer: string): Promise<EvaluationResult> {
    // 구현
  }

  getName(): string {
    return 'Custom';
  }
}

// 2. src/providers/index.ts에 등록
case 'custom':
  return new CustomProvider(options);
```

### 9.2 커스텀 퀴즈 로직

```typescript
// 프로바이더에 커스텀 프롬프트 전달
const config: QuizConfig = {
  complexity: ComplexityLevel.HIGH,
  questionCount: 3,
  customPrompt: 'Focus on security implications',
};
```
