# 코드베이스 컨텍스트

## 프로젝트 구조

```
src/
├── index.ts          # 메인 GitQuiz 클래스, diff 처리
├── cli.ts            # CLI 파싱, hook 설치
├── analyzer/
│   └── complexity.ts # ComplexityAnalyzer, diff 분석
├── providers/
│   └── index.ts      # AI 제공자들 (OpenAI, Anthropic, Gemini, Ollama)
├── quiz/
│   └── manager.ts    # 퀴즈 생성/평가
├── types/
│   └── index.ts      # 타입 정의
└── utils/            # [새로 생성] 유틸리티
    ├── index.ts
    └── ignoreParser.ts
```

## 핵심 수정 파일

### 1. src/index.ts

**현재 diff 처리 흐름 (라인 31-42):**
```typescript
async run(): Promise<void> {
  // ...
  const diff = this.getDiff();                    // 라인 31
  // ...
  const sanitizedDiff = this.sanitizeDiff(diff);  // 라인 39
  const analysis = this.analyzer.analyzeDiff(sanitizedDiff);  // 라인 42
}
```

**수정 후:**
```typescript
async run(): Promise<void> {
  const diff = this.getDiff();
  const sanitizedDiff = this.sanitizeDiff(diff);
  const filteredDiff = this.filterIgnoredFiles(sanitizedDiff);  // 새 라인
  const analysis = this.analyzer.analyzeDiff(filteredDiff);
}
```

**추가할 메서드:**
- `filterIgnoredFiles(diff: string): string` - diff에서 제외 파일 블록 제거

**추가할 프로퍼티:**
- `ignoreParser: IgnoreParser` - 생성자에서 초기화

### 2. src/cli.ts

**hook 설치 함수 (라인 45-110):**
- `installGitHooks()` 함수에서 성공 메시지 출력 후 `.quizignore` 안내 추가

**추가할 출력:**
```
✓ Git hooks installed successfully!

💡 Tip: Create a .quizignore file to exclude files from quiz analysis:
   echo "plans/**" >> .quizignore
   echo "docs/**" >> .quizignore

   Default excluded: node_modules/**, dist/**, .git/**, *.lock
```

### 3. src/types/index.ts

**추가할 인터페이스:**
```typescript
export interface IgnoreConfig {
  patterns: string[];
  defaultPatterns: string[];
}
```

### 4. src/utils/ignoreParser.ts (새로 생성)

**클래스 구조:**
```typescript
import { minimatch } from 'minimatch';
import { existsSync, readFileSync } from 'fs';

export class IgnoreParser {
  private patterns: string[] = [];

  private readonly defaultPatterns = [
    'node_modules/**',
    'dist/**',
    '.git/**',
    '*.lock',
    'package-lock.json',
  ];

  constructor() {
    this.patterns = [...this.defaultPatterns];
  }

  loadIgnoreFile(filepath: string): void {
    if (!existsSync(filepath)) return;

    const content = readFileSync(filepath, 'utf-8');
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    this.patterns.push(...lines);
  }

  shouldIgnore(filePath: string): boolean {
    return this.patterns.some(pattern =>
      minimatch(filePath, pattern, { dot: true })
    );
  }
}
```

## Diff 파싱 패턴

Git diff 형식:
```diff
diff --git a/path/to/file.ts b/path/to/file.ts
index abc123..def456 100644
--- a/path/to/file.ts
+++ b/path/to/file.ts
@@ -10,5 +10,7 @@
 context line
-removed line
+added line
```

파일 경로 추출: `diff --git a/(.+) b/(.+)` 정규식 사용

## 기존 패턴 참고

### complexity.ts의 파일 패턴 매칭 (라인 51-68)
```typescript
private readonly configPatterns = [
  /package\.json$/,
  /tsconfig\.json$/,
  // ...
];

private readonly testPatterns = [
  /\.(test|spec)\.(ts|js|tsx|jsx)$/,
  /__tests__\//,
  // ...
];
```

### sanitizeDiff()의 정규식 패턴 (index.ts 라인 150-180)
```typescript
private sanitizeDiff(diff: string): string {
  const sensitivePatterns = [
    /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[\w-]+['"]?/gi,
    // ...
  ];
  // ...
}
```

## 의존성

### 현재 (package.json)
```json
{
  "dependencies": {
    "@inquirer/confirm": "^6.0.4",
    "@inquirer/input": "^5.0.4",
    "@inquirer/select": "^5.0.4",
    "chalk": "^5.6.2",
    "commander": "^14.0.2",
    "node-fetch": "^3.3.2",
    "openai": "^6.16.0",
    "ora": "^9.1.0"
  }
}
```

### 추가 필요
```json
{
  "dependencies": {
    "minimatch": "^10.0.1"
  }
}
```
