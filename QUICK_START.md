# Quick Start Guide

Get started with review-before-go in under 2 minutes.

## 1. Install

```bash
npm install -g review-before-go
```

## 2. Set Up API Key (OpenAI)

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or use Ollama for local, free AI:

```bash
# Install Ollama from https://ollama.ai
ollama serve
```

## 3. Run Quiz

```bash
# Run the quiz (analyzes all uncommitted changes)
review-before-go

# Or with Ollama (no API key needed)
review-before-go --provider ollama
```

> **Note**: By default, `review-before-go` analyzes all uncommitted changes (staged + unstaged).
> When used via git pre-push hook, it automatically switches to `--mode pre-push` to analyze only commits being pushed.

## 4. Install Git Hook (Optional)

```bash
review-before-go --install-hooks
git config quiz.enabled true
```

Now the quiz runs automatically before every `git push`.

## Example Session

```
$ review-before-go

📊 Diff Analysis:
   Files: 2
   Lines: +45 / -12
   Complexity: 35 (MEDIUM)
   Quiz Questions: 2

🤖 Generating quiz using openai...

📝 Code Review Quiz
Complexity: MEDIUM | Questions: 2

Question 1/2
Context: Changes in src/utils/parser.ts

? What is the purpose of the new `parseConfig` function?
❯ A) To read JSON files from disk
  B) To validate and parse configuration objects
  C) To convert strings to numbers
  D) To handle HTTP requests

(Use arrow keys ↑↓ to select, Enter to confirm)

✓ Score: 9/10
Feedback: Excellent! The function validates and parses config objects.

Question 2/2
Explain why the error handling was changed in the `loadData` function.

Your answer: The try-catch was added to handle async errors gracefully
and provide better error messages to users.

✓ Score: 8/10
Feedback: Good understanding of the error handling improvements.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Quiz Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Congratulations! You passed!

Score: 2/2 (100%)

✅ Quiz passed! Proceeding with commit.
```

## Next Steps

- Read the full [README.md](./README.md)
- Configure quiz language: `review-before-go --language ko`
- Set up [Claude Code integration](./claude-hook/README.md)
