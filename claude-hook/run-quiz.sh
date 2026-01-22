#!/bin/bash
#
# quiz-before-push hook script for Claude Code
# This script is called by Claude Code's post-edit hook to run a code review quiz.
#
# Environment variables provided by Claude Code:
#   CLAUDE_HOOK_DIR   - Directory containing this script
#   CLAUDE_EDIT_FILES - List of edited files (newline separated)
#   CLAUDE_EDIT_DIFF  - The diff of changes made
#

set -e

# Check if quiz is enabled (from settings or environment)
QUIZ_ENABLED="${GIT_QUIZ_ENABLED:-true}"
if [ "$QUIZ_ENABLED" != "true" ]; then
    echo "quiz-before-push: Skipping quiz (disabled)"
    exit 0
fi

# Minimum changed lines to trigger quiz (default: 10)
MIN_LINES="${GIT_QUIZ_MIN_LINES:-10}"

# Count changed lines
if [ -n "$CLAUDE_EDIT_DIFF" ]; then
    CHANGED_LINES=$(echo "$CLAUDE_EDIT_DIFF" | grep -c '^[+-]' || echo "0")

    if [ "$CHANGED_LINES" -lt "$MIN_LINES" ]; then
        echo "quiz-before-push: Skipping quiz (only $CHANGED_LINES lines changed, minimum is $MIN_LINES)"
        exit 0
    fi
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  quiz-before-push Code Review Quiz                    ║"
echo "║       Ensuring you understand the AI-generated changes        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Build options
OPTIONS="--provider ${GIT_QUIZ_PROVIDER:-claude-code}"

if [ -n "$GIT_QUIZ_MODEL" ]; then
    OPTIONS="$OPTIONS --model $GIT_QUIZ_MODEL"
fi

if [ -n "$GIT_QUIZ_LANGUAGE" ]; then
    OPTIONS="$OPTIONS --language $GIT_QUIZ_LANGUAGE"
fi

# Run the quiz
if command -v quiz-before-push >/dev/null 2>&1; then
    eval "quiz-before-push $OPTIONS"
elif command -v npx >/dev/null 2>&1; then
    eval "npx quiz-before-push $OPTIONS"
else
    echo "Error: quiz-before-push is not installed."
    echo "Install with: npm install -g quiz-before-push"
    exit 1
fi

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                      Quiz Failed                              ║"
    echo "║  Please review the changes carefully before proceeding.       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
fi

exit $EXIT_CODE
