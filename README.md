# review-before-go

AI-powered code review quiz to ensure developers understand AI-written code before committing.

## Why?

When using AI coding assistants like Claude Code, GitHub Copilot, or ChatGPT, it's easy to accept code changes without fully understanding them. **review-before-go** creates a quick quiz about the changes to verify you understand what's being committed.

## Features

- **Multiple AI Providers**: OpenAI, Anthropic, Ollama (local), or Claude Code
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
# Run quiz on staged changes
review-before-go

# Install as git hook
review-before-go --install-hooks
git config quiz.enabled true

# Use with Ollama (local, no API key needed)
review-before-go --provider ollama

# Quiz in Korean
review-before-go --language ko
```

## Configuration

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --provider <provider>` | AI provider (openai, anthropic, ollama, claude-code) | `openai` |
| `-m, --model <model>` | Model to use | Provider default |
| `-k, --api-key <key>` | API key (OpenAI or Anthropic) | `$OPENAI_API_KEY` or `$ANTHROPIC_API_KEY` |
| `-u, --ollama-url <url>` | Ollama server URL | `http://localhost:11434` |
| `-l, --language <lang>` | Quiz language (en, ko, ja, etc.) | Auto-detect |
| `--mode <mode>` | Diff mode: `default` or `pre-push` | `default` |
| `-s, --skip-quiz` | Skip quiz (not recommended) | `false` |
| `--install-hooks` | Install git pre-push hook | - |

### Diff Modes

| Mode | Git Command | Use Case |
|------|-------------|----------|
| `default` | `git diff HEAD` | Post-edit, general use (staged + unstaged changes) |
| `pre-push` | `git diff @{push}..HEAD` | Pre-push hook (commits to be pushed) |

The `pre-push` mode is automatically used when running via git pre-push hook.

### Git Config

You can also configure via git config:

```bash
git config quiz.enabled true        # Enable quiz hook
git config quiz.provider openai     # Set provider
git config quiz.model gpt-4o-mini   # Set model
git config quiz.language ko         # Set language
git config quiz.apiKey sk-...       # Set API key (not recommended, use env var)
```

### Environment Variables

```bash
export OPENAI_API_KEY=sk-...        # OpenAI API key
export ANTHROPIC_API_KEY=sk-ant-... # Anthropic API key
```

## Providers

### OpenAI (Default)

Requires `OPENAI_API_KEY` environment variable or `--api-key` option.

```bash
review-before-go --provider openai --model gpt-4o
```

### Anthropic

Requires `ANTHROPIC_API_KEY` environment variable or `--api-key` option.

```bash
review-before-go --provider anthropic --model claude-sonnet-4-20250514
```

### Ollama (Local)

Run AI locally with no API key required.

```bash
# Start Ollama server
ollama serve

# Run quiz with Ollama
review-before-go --provider ollama --model llama3.2
```

### Claude Code

Uses the Claude CLI for quiz generation.

```bash
review-before-go --provider claude-code
```

## Git Hook Integration

### Install Hook

```bash
review-before-go --install-hooks
git config quiz.enabled true
```

### Manual Installation

Copy the hook script:

```bash
cp node_modules/review-before-go/hooks/pre-push .git/hooks/
chmod +x .git/hooks/pre-push
git config quiz.enabled true
```

## Claude Code Integration

See [claude-hook/README.md](./claude-hook/README.md) for Claude Code post-edit hook setup.

## How It Works

1. **Detect Changes**: Analyzes git diff (mode-dependent)
   - `default` mode: `git diff HEAD` (staged + unstaged)
   - `pre-push` mode: `git diff @{push}..HEAD` (commits to push)
2. **Calculate Complexity**: Determines quiz difficulty based on:
   - Number of files changed
   - Lines added/deleted
   - Function/class changes
   - Config file changes
3. **Generate Quiz**: AI creates 1-5 questions (adaptive)
4. **Evaluate Answers**: AI scores responses 0-10 (7+ passes)
5. **Allow/Block**: Pass allows commit, fail blocks (with bypass option)

## Security

review-before-go automatically redacts sensitive data before sending to AI:
- API keys and secrets
- Passwords and credentials
- JWT tokens
- Database connection strings
- Private keys

See [docs/SECURITY.md](./docs/SECURITY.md) for details.

## API Usage

```typescript
import { GitQuiz, createProvider, ComplexityAnalyzer } from 'review-before-go';

// Use the main class
const quiz = new GitQuiz({
  provider: 'openai',
  model: 'gpt-4o-mini',
  language: 'en',
});
const exitCode = await quiz.run();

// Or use components directly
const provider = createProvider({ provider: 'openai' });
const analyzer = new ComplexityAnalyzer();
const analysis = analyzer.analyzeDiff(diff);
const quizData = await provider.generateQuiz(diff, analysis.complexity);
```

See [docs/API.md](./docs/API.md) for full API documentation.

## License

MIT
