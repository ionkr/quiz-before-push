# review-before-go

[![npm version](https://img.shields.io/npm/v/review-before-go.svg)](https://www.npmjs.com/package/review-before-go)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[한국어 문서 (Korean)](./README.ko.md)**

AI-powered code review quiz that ensures developers understand AI-generated code before committing.

## Why?

When using AI coding assistants like Claude Code, GitHub Copilot, or ChatGPT, it's easy to accept code changes without fully understanding them. **review-before-go** creates a quick quiz about the changes to verify you understand what's being committed.

- Prevent blind acceptance of AI-generated code
- Improve code comprehension through interactive quizzes
- Block commits until understanding is verified

## Features

- **Multiple AI Providers**: OpenAI, Anthropic, Gemini, Ollama (local), Claude Code
- **Adaptive Difficulty**: Quiz complexity matches code change complexity
- **Multi-language Support**: Quiz in any language (auto-detected or configured)
- **Git Integration**: Works as a pre-push hook or standalone CLI
- **Claude Code Integration**: Post-edit hook for real-time quizzes
- **Security First**: Automatically redacts sensitive data from diffs

## Installation

```bash
# npm
npm install -g review-before-go

# pnpm
pnpm add -g review-before-go

# yarn
yarn global add review-before-go
```

## Example

```
$ git push origin main
Running review-before-go...
📊 Diff Analysis: Files: 2 | Lines: +134/-54 | Complexity: MEDIUM | Questions: 3

📝 Code Review Quiz

Question 1/3
What is the purpose of the new `validateInput()` function?
  A) To sanitize user input before database queries
  B) To check file permissions
  C) To validate API responses
✔ Your answer: A
✓ Correct! (10/10)

Question 2/3
Explain why the error handling was changed from try-catch to Result type.
✔ Your answer: For better performance
✗ Score: 3/10
  Feedback: The change was made for explicit error handling and type safety,
  not performance. Result types make error states visible in the type system.

Question 3/3
What does the `--recursive` flag do in the new CLI command?
✔ Your answer: It processes all subdirectories and their contents
✓ Correct! (10/10)

🎉 Quiz passed! (23/30) Proceeding with push.
To github.com:user/repo.git  main -> main
```

## Git Hook Setup (Recommended)

The primary use case is running as a **git pre-push hook** - the quiz runs automatically before every `git push`.

### 1. Install the Hook

```bash
review-before-go --install-hooks
git config quiz.enabled true
```

### 2. Configure Your Provider

Choose an AI provider and set the required API key:

```bash
# OpenAI (default)
export OPENAI_API_KEY=sk-...
git config quiz.provider openai

# Anthropic
export ANTHROPIC_API_KEY=sk-ant-...
git config quiz.provider anthropic

# Gemini
export GEMINI_API_KEY=...
git config quiz.provider gemini

# Ollama (local, no API key needed)
ollama serve
git config quiz.provider ollama

# Claude Code (no setup needed)
git config quiz.provider claude-code
```

### 3. Configure Options (Optional)

```bash
git config quiz.model gpt-4o          # Set specific model
git config quiz.language ko           # Set quiz language (en, ko, ja, etc.)
```

### 4. Push Your Code

```bash
git push  # Quiz runs before push
```

### Skipping the Quiz

If you need to bypass the quiz temporarily:

```bash
# Skip for a single push
git push --no-verify

# Disable quiz temporarily
git config quiz.enabled false
git push
git config quiz.enabled true
```

> **Warning**: Skipping the quiz defeats the purpose of code review verification. Use sparingly.

## Standalone CLI Usage

You can also run the quiz manually without git hooks:

```bash
# Run quiz on current changes
review-before-go

# Use with different providers
review-before-go --provider openai      # OpenAI (default)
review-before-go --provider anthropic   # Anthropic Claude
review-before-go --provider gemini      # Google Gemini
review-before-go --provider ollama      # Local Ollama
review-before-go --provider claude-code # Claude Code CLI

# Quiz in specific language
review-before-go --language ko  # Korean
review-before-go --language ja  # Japanese
```

## AI Agent Setup Guide

<details>
<summary><strong>For AI Agents (Claude Code, Cursor, Copilot, etc.)</strong> - Click to expand</summary>

> When a user asks you to set up `review-before-go`, follow these instructions.

### Step 1: Ask User Preferences

Before installation, ask the user the following questions:

1. **Which AI provider would you like to use for the quiz?**
   - `openai` - OpenAI API (requires OPENAI_API_KEY)
   - `anthropic` - Anthropic API (requires ANTHROPIC_API_KEY)
   - `gemini` - Google Gemini API (requires GEMINI_API_KEY)
   - `ollama` - Local Ollama (no API key, runs locally)
   - `claude-code` - Claude Code CLI (no additional setup)

2. **Which model do you want to use?** (Optional, provider defaults will be used if not specified)
   - OpenAI: `gpt-4o`, `gpt-4o-mini`, etc.
   - Anthropic: `claude-sonnet-4-20250514`, `claude-opus-4-20250514`, etc.
   - Gemini: `gemini-3-flash-preview`, `gemini-2.5-flash`, etc.
   - Ollama: `llama3.2`, `codellama`, etc.

3. **What language should the quiz be in?** (Optional)
   - `en`, `ko`, `ja`, etc. (auto-detect if not specified)

4. **Do you want to install a git pre-push hook?**
   - If yes, the quiz will run automatically before every `git push`

### Step 2: Installation

```bash
npm install -g review-before-go
```

### Step 3: Configure Based on User Choices

```bash
# Set the provider
git config quiz.provider <chosen-provider>

# Set the model (if specified)
git config quiz.model <chosen-model>

# Set the language (if specified)
git config quiz.language <chosen-language>
```

### Step 4: Git Hook Setup (if requested)

```bash
review-before-go --install-hooks
git config quiz.enabled true
```

### Step 5: Verify API Key (if needed)

- **OpenAI**: Verify `OPENAI_API_KEY` environment variable is set
- **Anthropic**: Verify `ANTHROPIC_API_KEY` environment variable is set
- **Gemini**: Verify `GEMINI_API_KEY` environment variable is set
- **Ollama**: Verify Ollama is running (`ollama serve`)
- **Claude Code**: No verification needed

### Claude Code Post-Edit Hook (Optional)

If the user is using Claude Code and wants real-time quizzes after edits, add to `~/.claude/settings.json`:

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

## Configuration

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --provider <provider>` | AI provider (openai, anthropic, gemini, ollama, claude-code) | `openai` |
| `-m, --model <model>` | Model to use | Provider default |
| `-k, --api-key <key>` | API key | `$OPENAI_API_KEY` or `$ANTHROPIC_API_KEY` |
| `-u, --ollama-url <url>` | Ollama server URL | `http://localhost:11434` |
| `-l, --language <lang>` | Quiz language (en, ko, ja, etc.) | Auto-detect |
| `--mode <mode>` | Diff mode: `default` or `pre-push` | `default` |
| `-s, --skip-quiz` | Skip quiz | `false` |
| `--install-hooks` | Install git pre-push hook | - |

### Diff Modes

| Mode | Git Command | Use Case |
|------|-------------|----------|
| `default` | `git diff HEAD` | General use (staged + unstaged changes) |
| `pre-push` | `git diff @{push}..HEAD` | Pre-push hook (commits to be pushed) |

### Git Config

See [Git Hook Setup](#git-hook-setup-recommended) for details on configuring via git config.

### Environment Variables

```bash
export OPENAI_API_KEY=sk-...        # OpenAI API key
export ANTHROPIC_API_KEY=sk-ant-... # Anthropic API key
export GEMINI_API_KEY=...           # Google Gemini API key
```

## Providers

### OpenAI (Default)

```bash
export OPENAI_API_KEY=sk-...
review-before-go --provider openai --model gpt-4o
```

### Anthropic

```bash
export ANTHROPIC_API_KEY=sk-ant-...
review-before-go --provider anthropic --model claude-sonnet-4-20250514
```

### Gemini

```bash
export GEMINI_API_KEY=...
review-before-go --provider gemini --model gemini-3-flash-preview
```

### Ollama (Local)

No API key required. Runs entirely locally.

```bash
ollama serve  # Start Ollama server
review-before-go --provider ollama --model llama3.2
```

### Claude Code

Uses the Claude CLI. No additional configuration needed.

```bash
review-before-go --provider claude-code
```

## How It Works

```
┌─────────────────┐
│  Code Changes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Analyze Diff    │ ← Calculate complexity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Quiz   │ ← 1-5 questions based on complexity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Evaluate Answer │ ← Score 0-10, pass if ≥7
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
 Pass ✓    Fail ✗
    │         │
 Commit    Retry or
 allowed   bypass
```

## Security

Sensitive data is automatically redacted before sending to AI:

- API keys and secrets
- Passwords and credentials
- JWT tokens
- Database connection strings
- Private keys

For maximum security, use Ollama (local) - no data leaves your machine.

See [docs/SECURITY.md](./docs/SECURITY.md) for details.

## Programmatic API

```typescript
import { GitQuiz, createProvider, ComplexityAnalyzer } from 'review-before-go';

const quiz = new GitQuiz({
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  language: 'en',
});

const exitCode = await quiz.run();
```

See [docs/API.md](./docs/API.md) for full API documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
