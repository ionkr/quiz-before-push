# quiz-before-push

[![npm version](https://img.shields.io/npm/v/quiz-before-push.svg)](https://www.npmjs.com/package/quiz-before-push)
[![npm downloads](https://img.shields.io/npm/dm/quiz-before-push.svg)](https://www.npmjs.com/package/quiz-before-push)
[![node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[한국어 문서 (Korean)](./README.ko.md)**

AI-powered code review quiz that ensures developers understand AI-generated code before committing.

> **29 kB** lightweight | **5 AI providers** | **Adaptive difficulty** | **Multi-language**

## Quick Start

```bash
# Install
npm install -g quiz-before-push

# Set up git hook (one-time)
quiz-before-push --install-hooks && git config quiz.enabled true

# Configure AI provider (choose one)
export OPENAI_API_KEY=sk-...    # or ANTHROPIC_API_KEY, GEMINI_API_KEY

# Push with quiz
git push
```

## Table of Contents

- [Quick Start](#quick-start)
- [Why?](#why)
- [Features](#features)
- [Example](#example)
- [Installation](#installation)
- [Git Hook Setup](#git-hook-setup-recommended)
- [Standalone CLI](#standalone-cli-usage)
- [Configuration](#configuration)
- [Providers](#providers)
- [How It Works](#how-it-works)
- [Performance](#performance)
- [Security](#security)
- [API](#programmatic-api)

## Why?

### The Problem

AI coding assistants (Claude Code, GitHub Copilot, ChatGPT) are transforming how we write code. But with great power comes great risk:

- Developers often accept AI suggestions **without fully understanding them**
- Code that "just works" may contain hidden bugs, security flaws, or architectural issues
- Technical debt accumulates when teams merge code nobody truly comprehends

### The Solution

**quiz-before-push** creates a quick quiz about your changes before committing. If you can't explain what the code does, you probably shouldn't commit it.

- **Prevent blind acceptance** of AI-generated code
- **Improve comprehension** through interactive questions
- **Block commits** until understanding is verified
- **Adaptive difficulty** - complex changes get more questions

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
npm install -g quiz-before-push

# pnpm
pnpm add -g quiz-before-push

# yarn
yarn global add quiz-before-push
```

## Example

```
$ git push origin main
Running quiz-before-push...
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
quiz-before-push --install-hooks
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
quiz-before-push

# Use with different providers
quiz-before-push --provider openai      # OpenAI (default)
quiz-before-push --provider anthropic   # Anthropic Claude
quiz-before-push --provider gemini      # Google Gemini
quiz-before-push --provider ollama      # Local Ollama
quiz-before-push --provider claude-code # Claude Code CLI

# Quiz in specific language
quiz-before-push --language ko  # Korean
quiz-before-push --language ja  # Japanese
```

## AI Agent Setup Guide

<details>
<summary><strong>For AI Agents (Claude Code, Cursor, Copilot, etc.)</strong> - Click to expand</summary>

> When a user asks you to set up `quiz-before-push`, follow these instructions.

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
npm install -g quiz-before-push
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
quiz-before-push --install-hooks
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

### Ollama (Local)

No API key required. Runs entirely locally.

```bash
ollama serve  # Start Ollama server
quiz-before-push --provider ollama --model llama3.2
```

### Claude Code

Uses the Claude CLI. No additional configuration needed.

```bash
quiz-before-push --provider claude-code
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

## Performance

| Metric | Value |
|--------|-------|
| Package size | 29 kB (gzipped) |
| Dependencies | 7 runtime |
| Node.js | >= 16 |
| Quiz generation | ~3-10s (varies by provider) |
| Local evaluation | < 100ms |

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
import { GitQuiz, createProvider, ComplexityAnalyzer } from 'quiz-before-push';

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
