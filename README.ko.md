# review-before-go

[![npm version](https://img.shields.io/npm/v/review-before-go.svg)](https://www.npmjs.com/package/review-before-go)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[English Documentation](./README.md)**

AI가 생성한 코드를 커밋하기 전에 개발자가 이해했는지 확인하는 AI 기반 코드 리뷰 퀴즈 도구입니다.

## 왜 필요한가요?

Claude Code, GitHub Copilot, ChatGPT 같은 AI 코딩 어시스턴트를 사용할 때, 코드 변경사항을 완전히 이해하지 않고 수락하기 쉽습니다. **review-before-go**는 커밋하려는 변경사항에 대한 퀴즈를 생성하여 코드를 이해했는지 검증합니다.

- AI가 생성한 코드를 무분별하게 수락하는 것을 방지
- 대화형 퀴즈를 통한 코드 이해도 향상
- 이해가 검증될 때까지 커밋 차단

## 주요 기능

- **다양한 AI 프로바이더 지원**: OpenAI, Anthropic, Ollama (로컬), Claude Code
- **적응형 난이도**: 코드 변경 복잡도에 맞춰 퀴즈 난이도 자동 조절
- **다국어 지원**: 모든 언어로 퀴즈 생성 (자동 감지 또는 설정 가능)
- **Git 통합**: pre-push 훅 또는 독립 실행형 CLI로 사용
- **Claude Code 통합**: 편집 후 실시간 퀴즈를 위한 post-edit 훅
- **보안 우선**: diff에서 민감한 데이터 자동 제거

## 설치

```bash
# npm
npm install -g review-before-go

# pnpm
pnpm add -g review-before-go

# yarn
yarn global add review-before-go
```

## Git 훅 설정 (권장)

주요 사용 사례는 **git pre-push 훅**으로 실행하는 것입니다 - `git push` 전에 자동으로 퀴즈가 실행됩니다.

### 1. 훅 설치

```bash
review-before-go --install-hooks
git config quiz.enabled true
```

### 2. 프로바이더 설정

AI 프로바이더를 선택하고 필요한 API 키를 설정하세요:

```bash
# OpenAI (기본값)
export OPENAI_API_KEY=sk-...
git config quiz.provider openai

# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
git config quiz.provider anthropic

# Ollama (로컬, API 키 불필요)
ollama serve
git config quiz.provider ollama

# Claude Code (설정 불필요)
git config quiz.provider claude-code
```

### 3. 옵션 설정 (선택사항)

```bash
git config quiz.model gpt-4o          # 특정 모델 지정
git config quiz.language ko           # 퀴즈 언어 설정 (en, ko, ja 등)
```

### 4. 코드 푸시

이제 `git push`를 실행하면 자동으로 퀴즈가 실행됩니다:

```bash
git push  # 푸시 전 퀴즈 실행
```

### 퀴즈 건너뛰기

일시적으로 퀴즈를 건너뛰어야 하는 경우:

```bash
# 단일 푸시에서 건너뛰기
git push --no-verify

# 퀴즈 임시 비활성화
git config quiz.enabled false
git push
git config quiz.enabled true
```

> **주의**: 퀴즈를 건너뛰면 코드 리뷰 검증의 목적이 무효화됩니다. 꼭 필요한 경우에만 사용하세요.

## 독립 실행형 CLI 사용

git 훅 없이 수동으로 퀴즈를 실행할 수도 있습니다:

```bash
# 현재 변경사항에 대한 퀴즈 실행
review-before-go

# 다른 프로바이더 사용
review-before-go --provider openai      # OpenAI (기본값)
review-before-go --provider anthropic   # Anthropic Claude
review-before-go --provider ollama      # 로컬 Ollama
review-before-go --provider claude-code # Claude Code CLI

# 특정 언어로 퀴즈 생성
review-before-go --language ko  # 한국어
review-before-go --language ja  # 일본어
```

## AI 에이전트 설정 가이드

<details>
<summary><strong>AI 에이전트(Claude Code, Cursor, Copilot 등)를 위한 안내</strong> - 클릭하여 펼치기</summary>

> 사용자가 `review-before-go` 설정을 요청하면 다음 지침을 따르세요.

### 1단계: 사용자 설정 확인

설치 전에 사용자에게 다음 질문을 하세요:

1. **퀴즈에 어떤 AI 프로바이더를 사용하시겠습니까?**
   - `openai` - OpenAI API (OPENAI_API_KEY 필요)
   - `anthropic` - Anthropic API (ANTHROPIC_API_KEY 필요)
   - `ollama` - 로컬 Ollama (API 키 불필요, 로컬 실행)
   - `claude-code` - Claude Code CLI (추가 설정 불필요)

2. **어떤 모델을 사용하시겠습니까?** (선택사항, 미지정 시 프로바이더 기본값 사용)
   - OpenAI: `gpt-4o`, `gpt-4o-mini` 등
   - Anthropic: `claude-sonnet-4-20250514`, `claude-opus-4-20250514` 등
   - Ollama: `llama3.2`, `codellama` 등

3. **퀴즈를 어떤 언어로 출제할까요?** (선택사항)
   - `en`, `ko`, `ja` 등 (미지정 시 자동 감지)

4. **git pre-push 훅을 설치할까요?**
   - 예를 선택하면 `git push` 전에 자동으로 퀴즈가 실행됩니다

### 2단계: 설치

```bash
npm install -g review-before-go
```

### 3단계: 사용자 선택에 따라 설정

```bash
# 프로바이더 설정
git config quiz.provider <선택한-프로바이더>

# 모델 설정 (지정한 경우)
git config quiz.model <선택한-모델>

# 언어 설정 (지정한 경우)
git config quiz.language <선택한-언어>
```

### 4단계: Git 훅 설정 (요청한 경우)

```bash
review-before-go --install-hooks
git config quiz.enabled true
```

### 5단계: API 키 확인 (필요한 경우)

- **OpenAI**: `OPENAI_API_KEY` 환경 변수가 설정되어 있는지 확인
- **Anthropic**: `ANTHROPIC_API_KEY` 환경 변수가 설정되어 있는지 확인
- **Ollama**: Ollama가 실행 중인지 확인 (`ollama serve`)
- **Claude Code**: 확인 불필요

### Claude Code Post-Edit 훅 (선택사항)

사용자가 Claude Code를 사용하고 편집 후 실시간 퀴즈를 원한다면, `~/.claude/settings.json`에 추가하세요:

```json
{
  "hooks": {
    "post-edit": [
      {
        "name": "review-before-go",
        "command": "review-before-go --provider claude-code",
        "timeout": 300000,
        "enabled": true
      }
    ]
  }
}
```

</details>

## 설정

### CLI 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-p, --provider <provider>` | AI 프로바이더 (openai, anthropic, ollama, claude-code) | `openai` |
| `-m, --model <model>` | 사용할 모델 | 프로바이더 기본값 |
| `-k, --api-key <key>` | API 키 | `$OPENAI_API_KEY` 또는 `$ANTHROPIC_API_KEY` |
| `-u, --ollama-url <url>` | Ollama 서버 URL | `http://localhost:11434` |
| `-l, --language <lang>` | 퀴즈 언어 (en, ko, ja 등) | 자동 감지 |
| `--mode <mode>` | Diff 모드: `default` 또는 `pre-push` | `default` |
| `-s, --skip-quiz` | 퀴즈 건너뛰기 | `false` |
| `--install-hooks` | git pre-push 훅 설치 | - |

### Diff 모드

| 모드 | Git 명령어 | 사용 사례 |
|------|-----------|-----------|
| `default` | `git diff HEAD` | 일반 사용 (staged + unstaged 변경사항) |
| `pre-push` | `git diff @{push}..HEAD` | pre-push 훅 (푸시할 커밋들) |

### Git Config

git config를 통한 설정 방법은 [Git 훅 설정](#git-훅-설정-권장) 섹션을 참조하세요.

### 환경 변수

```bash
export OPENAI_API_KEY=sk-...        # OpenAI API 키
export ANTHROPIC_API_KEY=sk-ant-... # Anthropic API 키
```

## 프로바이더

### OpenAI (기본값)

```bash
export OPENAI_API_KEY=sk-...
review-before-go --provider openai --model gpt-4o
```

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-...
review-before-go --provider anthropic --model claude-sonnet-4-20250514
```

### Ollama (로컬)

API 키가 필요 없습니다. 완전히 로컬에서 실행됩니다.

```bash
ollama serve  # Ollama 서버 시작
review-before-go --provider ollama --model llama3.2
```

### Claude Code

Claude CLI를 사용합니다. 추가 설정이 필요 없습니다.

```bash
review-before-go --provider claude-code
```

## 동작 방식

```
┌─────────────────┐
│   코드 변경사항   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Diff 분석     │ ← 복잡도 계산
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   퀴즈 생성     │ ← 복잡도에 따라 1-5개 문제
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   답변 평가     │ ← 0-10점 채점, 7점 이상 통과
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 통과 ✓    실패 ✗
    │         │
 커밋      재시도
 허용      또는 우회
```

## 보안

AI에 전송하기 전에 민감한 데이터가 자동으로 제거됩니다:

- API 키 및 시크릿
- 비밀번호 및 자격 증명
- JWT 토큰
- 데이터베이스 연결 문자열
- 개인 키

최대 보안을 위해 Ollama (로컬)를 사용하세요 - 데이터가 외부로 전송되지 않습니다.

자세한 내용은 [docs/SECURITY.md](./docs/SECURITY.md)를 참조하세요.

## 프로그래매틱 API

```typescript
import { GitQuiz, createProvider, ComplexityAnalyzer } from 'review-before-go';

const quiz = new GitQuiz({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  language: 'ko',
});

const exitCode = await quiz.run();
```

전체 API 문서는 [docs/API.md](./docs/API.md)를 참조하세요.

## 기여하기

기여를 환영합니다! Pull Request를 자유롭게 제출해주세요.

## 라이선스

MIT
