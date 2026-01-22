# 코드베이스 분석 결과

## 디렉토리 구조

```
src/
├── analyzer/
│   └── complexity.ts      # 복잡도 분석 핵심 모듈 (197줄)
├── providers/
│   ├── index.ts           # Provider factory
│   ├── types.ts           # AIProvider 인터페이스
│   ├── openai.ts          # OpenAI 구현
│   ├── anthropic.ts       # Anthropic 구현
│   ├── gemini.ts          # Gemini 구현
│   ├── ollama.ts          # Ollama 구현
│   └── claude-code.ts     # Claude Code 구현
├── quiz/
│   └── manager.ts         # 퀴즈 실행 관리 (394줄)
├── types/
│   └── index.ts           # 타입 정의 (ComplexityLevel 등)
├── index.ts               # GitQuiz 클래스 (189줄)
└── cli.ts                 # CLI 진입점
```

## 핵심 파일 분석

### 1. ComplexityAnalyzer (`src/analyzer/complexity.ts`)

**현재 구조:**
```typescript
export interface DiffAnalysis {
  totalLines: number;
  addedLines: number;
  deletedLines: number;
  fileCount: number;
  files: string[];
  hasFunctionChanges: boolean;   // 개선 필요: 개수로 변경
  hasClassChanges: boolean;      // 개선 필요: 개수로 변경
  hasConfigChanges: boolean;
  hasTestChanges: boolean;
  complexity: number;
  level: ComplexityLevel;
}
```

**복잡도 계산 흐름:**
1. `analyzeDiff()`: diff 문자열 파싱 → DiffAnalysis 반환
2. `calculateComplexity()`: 점수 계산 (private)
3. `getDifficultyLevel()`: 점수 → ComplexityLevel
4. `getQuizCount()`: 점수 → 문제 수

### 2. Provider 중복 코드

각 Provider에 동일한 로직 존재:

```typescript
// openai.ts, anthropic.ts, gemini.ts, ollama.ts, claude-code.ts 모두 동일
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

### 3. GitQuiz (`src/index.ts`) 사용 패턴

```typescript
// 라인 42-48
const analyzer = new ComplexityAnalyzer();
const analysis = analyzer.analyzeDiff(sanitizedDiff);

console.log(`📊 Diff Analysis: Files: ${analysis.fileCount} | ...`);

// complexity 값을 Provider에 전달
const quiz = await provider.generateQuiz(sanitizedDiff, analysis.complexity);
```

## 의존성 관계

```
complexity.ts
    ↓ (import ComplexityLevel)
types/index.ts
    ↓ (import by)
index.ts (GitQuiz)
    ↓ (import createProvider)
providers/index.ts
    ↓ (import each provider)
providers/*.ts (5개)
```

## 리팩토링 영향 범위

### DiffAnalysis 인터페이스 변경 시:
- `src/analyzer/complexity.ts` - 정의
- `src/index.ts` - 사용 (라인 42-48)

### 중복 메서드 제거 시:
- `src/providers/openai.ts` - `getComplexityLevel()`, `getQuizCount()` 제거
- `src/providers/anthropic.ts` - 동일
- `src/providers/gemini.ts` - 동일
- `src/providers/ollama.ts` - 동일
- `src/providers/claude-code.ts` - 동일

### 공유 유틸리티 추가 시:
- `src/analyzer/complexity.ts`에서 export 추가 또는
- 새 파일 `src/utils/complexity.ts` 생성
