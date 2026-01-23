# quiz-before-push

[![npm version](https://img.shields.io/npm/v/quiz-before-push.svg)](https://www.npmjs.com/package/quiz-before-push)
[![npm downloads](https://img.shields.io/npm/dm/quiz-before-push.svg)](https://www.npmjs.com/package/quiz-before-push)
[![node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[English Documentation](./README.md)**

AI가 생성한 코드를 커밋하기 전에 개발자가 이해했는지 확인하는 AI 기반 코드 리뷰 퀴즈 도구입니다.

> **29 kB** 경량 | **5개 AI 프로바이더** | **적응형 난이도** | **다국어 지원**

## 빠른 시작

```bash
# 설치
npm install -g quiz-before-push

# git 훅 설정 (최초 1회)
quiz-before-push --install-hooks && git config quiz.enabled true

# AI 프로바이더 설정 (택 1)
export OPENAI_API_KEY=sk-...    # 또는 ANTHROPIC_API_KEY, GEMINI_API_KEY

# 퀴즈와 함께 푸시
git push
```

## 목차

- [빠른 시작](#빠른-시작)
- [왜 필요한가요?](#왜-필요한가요)
- [주요 기능](#주요-기능)
- [예시](#예시)
- [설치](#설치)
- [Git 훅 설정](#git-훅-설정-권장)
- [독립 실행형 CLI](#독립-실행형-cli-사용)
- [설정](#설정)
- [프로바이더](#프로바이더)
- [동작 방식](#동작-방식)
- [성능](#성능)
- [보안](#보안)
- [API](#프로그래매틱-api)

## 왜 필요한가요?

### 문제점

AI 코딩 어시스턴트(Claude Code, GitHub Copilot, ChatGPT)가 코드 작성 방식을 변화시키고 있습니다. 하지만 강력한 도구에는 위험도 따릅니다:

- 개발자들이 AI 제안을 **완전히 이해하지 않고** 수락하는 경우가 많습니다
- "일단 동작하는" 코드에 숨겨진 버그, 보안 취약점, 아키텍처 문제가 있을 수 있습니다
- 아무도 제대로 이해하지 못하는 코드가 머지되면 기술 부채가 쌓입니다

### 해결책

**quiz-before-push**는 커밋 전에 변경사항에 대한 퀴즈를 생성합니다. 코드가 무엇을 하는지 설명할 수 없다면, 커밋하면 안 됩니다.

- AI가 생성한 코드의 **무분별한 수락 방지**
- 대화형 질문을 통한 **이해도 향상**
- 이해가 검증될 때까지 **커밋 차단**
- **적응형 난이도** - 복잡한 변경에는 더 많은 질문

## 주요 기능

- **다양한 AI 프로바이더 지원**: OpenAI, Anthropic, Gemini, Ollama (로컬), Claude Code
- **적응형 난이도**: 코드 변경 복잡도에 맞춰 퀴즈 난이도 자동 조절
- **다국어 지원**: 모든 언어로 퀴즈 생성 (자동 감지 또는 설정 가능)
- **Git 통합**: pre-push 훅 또는 독립 실행형 CLI로 사용
- **Claude Code 통합**: 편집 후 실시간 퀴즈를 위한 post-edit 훅
- **보안 우선**: diff에서 민감한 데이터 자동 제거

## 설치

```bash
# npm
npm install -g quiz-before-push

# pnpm
pnpm add -g quiz-before-push

# yarn
yarn global add quiz-before-push
```

## 예시

```
$ git push origin main
Running quiz-before-push...
📊 Diff Analysis: Files: 2 | Lines: +134/-54 | Complexity: MEDIUM | Questions: 3

📝 Code Review Quiz

Question 1/3
새로운 `validateInput()` 함수의 목적은 무엇인가요?
  A) 데이터베이스 쿼리 전 사용자 입력을 검증하기 위해
  B) 파일 권한을 확인하기 위해
  C) API 응답을 검증하기 위해
✔ Your answer: A
✓ Correct! (10/10)

Question 2/3
에러 처리 방식을 try-catch에서 Result 타입으로 변경한 이유를 설명하세요.
✔ Your answer: 성능 향상을 위해
✗ Score: 3/10
  Feedback: 성능이 아닌 명시적 에러 처리와 타입 안전성을 위한 변경입니다.
  Result 타입은 에러 상태를 타입 시스템에서 명확하게 표현합니다.

Question 3/3
새 CLI 명령어의 `--recursive` 플래그는 어떤 역할을 하나요?
✔ Your answer: 모든 하위 디렉토리와 그 내용을 처리합니다
✓ Correct! (10/10)

🎉 Quiz passed! (23/30) Proceeding with push.
To github.com:user/repo.git  main -> main
```

## Git 훅 설정 (권장)

주요 사용 사례는 **git pre-push 훅**으로 실행하는 것입니다 - `git push` 전에 자동으로 퀴즈가 실행됩니다.

### 1. 훅 설치

```bash
quiz-before-push --install-hooks
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

# Gemini
export GEMINI_API_KEY=...
git config quiz.provider gemini

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
quiz-before-push

# 다른 프로바이더 사용
quiz-before-push --provider openai      # OpenAI (기본값)
quiz-before-push --provider anthropic   # Anthropic Claude
quiz-before-push --provider gemini      # Google Gemini
quiz-before-push --provider ollama      # 로컬 Ollama
quiz-before-push --provider claude-code # Claude Code CLI

# 특정 언어로 퀴즈 생성
quiz-before-push --language ko  # 한국어
quiz-before-push --language ja  # 일본어
```

## AI 에이전트 설정 가이드

<details>
<summary><strong>AI 에이전트(Claude Code, Cursor, Copilot 등)를 위한 안내</strong> - 클릭하여 펼치기</summary>

> 사용자가 `quiz-before-push` 설정을 요청하면 다음 지침을 따르세요.

### 1단계: 사용자 설정 확인

설치 전에 사용자에게 다음 질문을 하세요:

1. **퀴즈에 어떤 AI 프로바이더를 사용하시겠습니까?**
   - `openai` - OpenAI API (OPENAI_API_KEY 필요)
   - `anthropic` - Anthropic API (ANTHROPIC_API_KEY 필요)
   - `gemini` - Google Gemini API (GEMINI_API_KEY 필요)
   - `ollama` - 로컬 Ollama (API 키 불필요, 로컬 실행)
   - `claude-code` - Claude Code CLI (추가 설정 불필요)

2. **어떤 모델을 사용하시겠습니까?** (선택사항, 미지정 시 프로바이더 기본값 사용)
   - OpenAI: `gpt-4o`, `gpt-4o-mini` 등
   - Anthropic: `claude-sonnet-4-20250514`, `claude-opus-4-20250514` 등
   - Gemini: `gemini-3-flash-preview`, `gemini-2.5-flash` 등
   - Ollama: `llama3.2`, `codellama` 등

3. **퀴즈를 어떤 언어로 출제할까요?** (선택사항)
   - `en`, `ko`, `ja` 등 (미지정 시 자동 감지)

4. **git pre-push 훅을 설치할까요?**
   - 예를 선택하면 `git push` 전에 자동으로 퀴즈가 실행됩니다

### 2단계: 설치

```bash
npm install -g quiz-before-push
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
quiz-before-push --install-hooks
git config quiz.enabled true
```

### 5단계: API 키 확인 (필요한 경우)

- **OpenAI**: `OPENAI_API_KEY` 환경 변수가 설정되어 있는지 확인
- **Anthropic**: `ANTHROPIC_API_KEY` 환경 변수가 설정되어 있는지 확인
- **Gemini**: `GEMINI_API_KEY` 환경 변수가 설정되어 있는지 확인
- **Ollama**: Ollama가 실행 중인지 확인 (`ollama serve`)
- **Claude Code**: 확인 불필요

### Claude Code Post-Edit 훅 (선택사항)

사용자가 Claude Code를 사용하고 편집 후 실시간 퀴즈를 원한다면, `~/.claude/settings.json`에 추가하세요:

```json
{
  "hooks": {
    "post-edit": [
      {
        "name": "quiz-before-push",
        "command": "quiz-before-push --provider claude-code",
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
| `-p, --provider <provider>` | AI 프로바이더 (openai, anthropic, gemini, ollama, claude-code) | `openai` |
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
export GEMINI_API_KEY=...           # Google Gemini API 키
```

## 프로바이더

### OpenAI (기본값)

```bash
export OPENAI_API_KEY=sk-...
quiz-before-push --provider openai --model gpt-4o
```

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-...
quiz-before-push --provider anthropic --model claude-sonnet-4-20250514
```

### Gemini

```bash
export GEMINI_API_KEY=...
quiz-before-push --provider gemini --model gemini-3-flash-preview
```

### Ollama (로컬)

API 키가 필요 없습니다. 완전히 로컬에서 실행됩니다.

```bash
ollama serve  # Ollama 서버 시작
quiz-before-push --provider ollama --model llama3.2
```

### Claude Code

Claude CLI를 사용합니다. 추가 설정이 필요 없습니다.

```bash
quiz-before-push --provider claude-code
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

## 성능

| 항목 | 값 |
|------|-----|
| 패키지 크기 | 29 kB (gzipped) |
| 의존성 | 7개 런타임 |
| Node.js | >= 16 |
| 퀴즈 생성 | ~3-10초 (프로바이더별 상이) |
| 로컬 평가 | < 100ms |

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
import { GitQuiz, createProvider, ComplexityAnalyzer } from 'quiz-before-push';

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
