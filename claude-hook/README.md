# Claude Code Hook Setup

This directory contains configuration files for integrating quiz-before-push with Claude Code's hook system.

## Quick Setup

1. **Copy the hook files to your Claude Code settings directory:**

   ```bash
   # macOS/Linux
   cp -r claude-hook/* ~/.claude/hooks/quiz-before-push/

   # Windows
   copy claude-hook\* %USERPROFILE%\.claude\hooks\quiz-before-push\
   ```

2. **Make the script executable (macOS/Linux):**

   ```bash
   chmod +x ~/.claude/hooks/quiz-before-push/run-quiz.sh
   ```

3. **Add the hook to your Claude Code settings:**

   Edit `~/.claude/settings.json` and add the following to the `hooks` section:

   ```json
   {
     "hooks": {
       "post-edit": [
         {
           "name": "quiz-before-push",
           "description": "Run code review quiz after editing files",
           "command": "${HOME}/.claude/hooks/quiz-before-push/run-quiz.sh",
           "timeout": 300000,
           "enabled": true
         }
       ]
     }
   }
   ```

## Configuration

You can configure the quiz behavior using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GIT_QUIZ_ENABLED` | `true` | Enable/disable the quiz |
| `GIT_QUIZ_PROVIDER` | `claude-code` | AI provider (openai, ollama, claude-code) |
| `GIT_QUIZ_MODEL` | (provider default) | Model to use |
| `GIT_QUIZ_LANGUAGE` | (auto-detect) | Language for quiz questions |
| `GIT_QUIZ_MIN_LINES` | `10` | Minimum changed lines to trigger quiz |

## File Patterns

By default, the hook triggers for these file types:
- TypeScript: `*.ts`, `*.tsx`
- JavaScript: `*.js`, `*.jsx`
- Python: `*.py`
- Go: `*.go`
- Rust: `*.rs`

And excludes:
- `node_modules/`
- `dist/`
- Test files (`*.test.*`, `*.spec.*`)

You can customize these patterns in the `settings.json` file.

## Disabling Temporarily

To skip the quiz for a single session, set the environment variable:

```bash
export GIT_QUIZ_ENABLED=false
```

## Troubleshooting

### Quiz not running

1. Check if the hook is enabled in Claude Code settings
2. Verify the script is executable: `chmod +x run-quiz.sh`
3. Check if quiz-before-push is installed: `quiz-before-push --version`

### Timeout issues

Increase the timeout in settings.json if you have slow network:

```json
{
  "timeout": 600000
}
```

### Provider errors

- **OpenAI**: Ensure `OPENAI_API_KEY` environment variable is set
- **Ollama**: Ensure Ollama is running (`ollama serve`)
- **Claude Code**: The default provider, uses the Claude CLI
