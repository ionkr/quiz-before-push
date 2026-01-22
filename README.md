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

- **Multiple AI Providers**: OpenAI, Anthropic, Ollama (local), Claude Code
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

## Quick Start

```bash
# Run quiz on current changes
review-before-go

# Install as git pre-push hook
review-before-go --install-hooks
git config quiz.enabled true

# Use with different providers
review-before-go --provider openai      # OpenAI (default)
review-before-go --provider anthropic   # Anthropic Claude
review-before-go --provider ollama      # Local Ollama
review-before-go --provider claude-code # Claude Code CLI

# Quiz in specific language
review-before-go --language ko  # Korean
review-before-go --language ja  # Japanese
```

## AI Agent Setup Guide

> **For AI Agents (Claude Code, Cursor, Copilot, etc.):**
> When a user asks you to set up `review-before-go`, follow these instructions.

### Step 1: Ask User Preferences

Before installation, ask the user the following questions:

1. **Which AI provider would you like to use for the quiz?**
   - `openai` - OpenAI API (requires OPENAI_API_KEY)
   - `anthropic` - Anthropic API (requires ANTHROPIC_API_KEY)
   - `ollama` - Local Ollama (no API key, runs locally)
   - `claude-code` - Claude Code CLI (no additional setup)

2. **Which model do you want to use?** (Optional, provider defaults will be used if not specified)
   - OpenAI: `gpt-4o`, `gpt-4o-mini`, etc.
   - Anthropic: `claude-sonnet-4-20250514`, `claude-opus-4-20250514`, etc.
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

## Configuration

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --provider <provider>` | AI provider (openai, anthropic, ollama, claude-code) | `openai` |
| `-m, --model <model>` | Model to use | Provider default |
| `-k, --api-key <key>` | API key | `$OPENAI_API_KEY` or `$ANTHROPIC_API_KEY` |
| `-u, --ollama-url <url>` | Ollama server URL | `http://localhost:11434` |
| `-l, --language <lang>` | Quiz language (en, ko, ja, etc.) | Auto-detect |
| `--mode <mode>` | Diff mode: `default` or `pre-push` | `default` |
| `-s, --skip-quiz` | Skip quiz (not recommended) | `false` |
| `--install-hooks` | Install git pre-push hook | - |

### Diff Modes

| Mode | Git Command | Use Case |
|------|-------------|----------|
| `default` | `git diff HEAD` | General use (staged + unstaged changes) |
| `pre-push` | `git diff @{push}..HEAD` | Pre-push hook (commits to be pushed) |

### Git Config

```bash
git config quiz.enabled true        # Enable quiz hook
git config quiz.provider anthropic  # Set provider
git config quiz.model claude-sonnet-4-20250514  # Set model
git config quiz.language ko         # Set language
```

### Environment Variables

```bash
export OPENAI_API_KEY=sk-...        # OpenAI API key
export ANTHROPIC_API_KEY=sk-ant-... # Anthropic API key
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
