# 코드베이스 컨텍스트: git-rewrite-commits 분석

> 참고 프로젝트: https://github.com/f/git-rewrite-commits

## 1. 프로젝트 개요

git-rewrite-commits는 AI를 사용하여 Git 커밋 메시지를 자동으로 개선하는 CLI 도구입니다.
git-quiz 프로젝트의 구조와 패턴을 참고하기 위해 분석했습니다.

---

## 2. 재사용 가능한 패턴

### 2.1 프로바이더 패턴 (Strategy Pattern)

```
AIProvider (인터페이스)
    ↓
├── OpenAIProvider   (SDK 사용)
├── OllamaProvider   (HTTP REST API)
└── ClaudeCodeProvider (CLI 실행)
```

**팩토리 함수로 프로바이더 선택:**
```typescript
export function createProvider(options: ProviderOptions): AIProvider {
  switch (options.provider) {
    case 'ollama':
      return new OllamaProvider(options.model, options.ollamaUrl);
    case 'claude-code':
      return new ClaudeCodeProvider(options.model);
    default:
      return new OpenAIProvider(options.apiKey, options.model);
  }
}
```

### 2.2 CLI 구조 (Commander.js)

```typescript
const program = new Command()
  .name('git-quiz')
  .description('Quiz-based code review tool')
  .version(packageJson.version)
  .option('--provider <provider>', 'AI provider', 'openai')
  .option('-m, --model <model>', 'Model to use')
  .option('-k, --api-key <key>', 'API key')
  .action(async (options) => {
    // 메인 로직
  });
```

### 2.3 Git Hook 연동

**Unix 쉘 스크립트 (hooks/pre-push):**
```bash
#!/bin/sh
# Check if quiz is enabled
enabled=$(git config --bool quiz.enabled 2>/dev/null)
if [ "$enabled" != "true" ]; then
  exit 0
fi

# Run quiz
npx git-quiz --staged
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Quiz failed. Push blocked."
  exit 1
fi
```

**옵트-인 메커니즘:**
```bash
git config quiz.enabled true  # 활성화
```

### 2.4 민감 데이터 제거

```typescript
const SENSITIVE_PATTERNS = [
  // .env 파일 숨김
  /^[+-].*\.env$/gm,

  // API 키 제거
  /sk-[a-zA-Z0-9]{32,}/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /AKIA[A-Z0-9]{16}/g,

  // 개인키 제거
  /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/g,

  // 암호 패턴 제거
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
];

function redactSensitivePatterns(text: string): string {
  let result = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}
```

### 2.5 설정 우선순위 로딩

```typescript
function getConfigValue(key: string, cliValue?: string): string | undefined {
  // 1. CLI 옵션
  if (cliValue) return cliValue;

  // 2. 환경 변수
  const envKey = `GIT_QUIZ_${key.toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];

  // 3. Git Config
  try {
    const gitValue = execSync(`git config quiz.${key}`, { encoding: 'utf-8' }).trim();
    if (gitValue) return gitValue;
  } catch {}

  // 4. 기본값
  return undefined;
}
```

### 2.6 UI/UX 패턴 (Chalk + Ora)

```typescript
import chalk from 'chalk';
import ora from 'ora';

// 제목
console.log(chalk.cyan.bold('\n🧠 git-quiz\n'));

// 성공/실패 메시지
console.log(chalk.green('✓ Correct!'));
console.log(chalk.red('✗ Incorrect'));

// 스피너
const spinner = ora();
spinner.start(chalk.blue('Generating quiz...'));
// ... 작업 수행
spinner.succeed(chalk.green('Quiz ready!'));
```

---

## 3. 기술 스택 참고

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | TypeScript | 타입 안전성, 코드 품질 |
| 런타임 | Node.js >=16 | ES Modules 지원, 널리 사용 |
| 모듈 | ES Modules | 최신 표준, tree-shaking |
| CLI | Commander.js | 업계 표준, 풍부한 기능 |
| 색상 | Chalk | 직관적 API |
| 스피너 | Ora | 깔끔한 로딩 UX |
| HTTP | node-fetch | 가벼운 HTTP 클라이언트 |
| AI | openai SDK | 공식 SDK |

---

## 4. package.json 참고 구조

```json
{
  "name": "git-quiz",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "git-quiz": "./dist/cli.js"
  },
  "files": [
    "dist/**/*",
    "hooks/**/*",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "prepublishOnly": "npm run build"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "node-fetch": "^3.3.2",
    "openai": "^4.20.0",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.2"
  }
}
```

---

## 5. tsconfig.json 참고 구조

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 6. Git Hook 설치 로직 참고

```typescript
async function installHooks(): Promise<void> {
  const isWindows = process.platform === 'win32';
  const hooksDir = '.git/hooks';

  // hooks 디렉토리 생성
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookName = 'pre-push';
  const hookPath = path.join(hooksDir, hookName);
  const sourceHook = isWindows
    ? path.join(__dirname, '../hooks/pre-push.bat')
    : path.join(__dirname, '../hooks/pre-push');

  // 기존 훅 백업
  if (fs.existsSync(hookPath)) {
    const content = fs.readFileSync(hookPath, 'utf-8');
    if (!content.includes('git-quiz')) {
      fs.copyFileSync(hookPath, `${hookPath}.backup`);
      console.log(chalk.yellow(`Backed up existing hook to ${hookPath}.backup`));
    }
  }

  // 훅 복사
  fs.copyFileSync(sourceHook, hookPath);

  // 실행 권한 설정 (Unix)
  if (!isWindows) {
    fs.chmodSync(hookPath, 0o755);
  }

  console.log(chalk.green(`✓ Installed ${hookName} hook`));
}
```

---

## 7. git-quiz에서 달라지는 점

| 항목 | git-rewrite-commits | git-quiz |
|------|---------------------|----------|
| 목적 | 커밋 메시지 개선 | 코드 이해도 검증 |
| 출력 | 새 커밋 메시지 | 퀴즈 + 채점 결과 |
| 인터랙션 | 단방향 (생성) | 양방향 (질문-응답) |
| LLM 호출 | 1회 (생성) | 2회 (생성 + 채점) |
| 훅 | pre-commit, prepare-commit-msg | pre-push, post-edit |
| 실패 처리 | 이전 메시지 유지 | 작업 차단 |

---

## 8. 핵심 차이점: 퀴즈 로직

git-quiz만의 추가 구현 필요 항목:

1. **복잡도 분석기**: diff를 파싱하여 퀴즈 개수/난이도 결정
2. **퀴즈 매니저**: stdin/stdout 기반 인터랙티브 퀴즈 실행
3. **채점 로직**: LLM을 활용한 자연어 답변 평가
4. **재시도 처리**: 실패 시 우회 옵션 제공
5. **Claude Code 훅**: post-edit 훅 연동 설정
