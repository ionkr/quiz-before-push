# 코드베이스 컨텍스트

## 현재 Diff 획득 로직

### `src/index.ts:83-96`

```typescript
private getStagedDiff(): string {
  try {
    return execSync('git diff --staged', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw new Error('Failed to get staged diff. Are you in a git repository?');
    }
    throw error;
  }
}
```

### 호출 위치

`src/index.ts:31` - `run()` 메서드 내:
```typescript
const diff = this.getStagedDiff();
```

## CLI 옵션 구조

### `src/cli.ts:12-20`

```typescript
interface GitQuizCliOptions {
  provider: 'openai' | 'ollama' | 'claude-code' | 'anthropic';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
  skipQuiz?: boolean;
  installHooks?: boolean;
}
```

### 옵션 정의 위치

`src/cli.ts:111-125` - Commander.js 체인

### 옵션 처리 위치

`src/cli.ts:134-149` - `finalOptions` 객체 생성

## Pre-push 훅 구조

### `hooks/pre-push:76-90`

```bash
if command -v review-before-go >/dev/null 2>&1; then
    eval "review-before-go $OPTIONS"
    EXIT_CODE=$?
elif command -v npx >/dev/null 2>&1; then
    eval "npx review-before-go $OPTIONS"
    EXIT_CODE=$?
fi
```

### 훅 생성 로직

`src/cli.ts:44-109` - `installGitHooks()` 함수
- `prePushHook` 문자열 변수 (라인 59-80)에 훅 스크립트 정의

## 타입 체계

### `src/providers/index.ts:7-13`

```typescript
export interface ProviderOptions {
  provider: 'openai' | 'ollama' | 'claude-code' | 'anthropic';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
}
```

### `src/index.ts:7-11`

```typescript
export interface GitQuizOptions extends ProviderOptions {
  maxRetries?: number;
  passingScore?: number;
  skipQuiz?: boolean;
}
```

## 패턴 참고

### CLI 옵션 추가 패턴

```typescript
// 1. 인터페이스 추가
interface GitQuizCliOptions {
  newOption?: string;
}

// 2. Commander 옵션 추가
program.option('--new-option <value>', 'Description', 'default')

// 3. finalOptions에 추가
const finalOptions = {
  newOption: options.newOption || gitConfigDefaults.newOption || 'default',
};

// 4. GitQuiz 생성자에 전달
const gitQuiz = new GitQuiz({
  newOption: finalOptions.newOption,
});
```

### Git 명령 실행 패턴

```typescript
import { execSync } from 'child_process';

const result = execSync('git command', {
  encoding: 'utf-8',
  maxBuffer: 10 * 1024 * 1024,
});
```
