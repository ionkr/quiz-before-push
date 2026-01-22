@echo off
REM quiz-before-push pre-push hook for Windows
REM This hook runs before git push to ensure the developer understands the code changes.
REM
REM To install this hook:
REM   copy hooks\pre-push.bat .git\hooks\pre-push
REM   git config quiz.enabled true
REM
REM Or use the CLI:
REM   quiz-before-push --install-hooks
REM   git config quiz.enabled true
REM
REM Configuration (via git config):
REM   quiz.enabled    - Set to "true" to enable the quiz (required)
REM   quiz.provider   - AI provider: openai, ollama, claude-code (default: openai)
REM   quiz.model      - Model to use (provider-specific)
REM   quiz.apiKey     - API key for OpenAI (or use OPENAI_API_KEY env var)
REM   quiz.ollamaUrl  - Ollama server URL (default: http://localhost:11434)
REM   quiz.language   - Language for quiz questions (e.g., en, ko, ja)

setlocal enabledelayedexpansion

REM Check if quiz is enabled
for /f "tokens=*" %%i in ('git config --get quiz.enabled 2^>nul') do set QUIZ_ENABLED=%%i
if not "%QUIZ_ENABLED%"=="true" (
    exit /b 0
)

echo.
echo ===============================================================
echo                    quiz-before-push Pre-Push Hook
echo   Ensuring you understand the code before pushing to remote
echo ===============================================================
echo.

REM Build options from git config
set OPTIONS=

for /f "tokens=*" %%i in ('git config --get quiz.provider 2^>nul') do set PROVIDER=%%i
if defined PROVIDER set OPTIONS=!OPTIONS! --provider !PROVIDER!

for /f "tokens=*" %%i in ('git config --get quiz.model 2^>nul') do set MODEL=%%i
if defined MODEL set OPTIONS=!OPTIONS! --model !MODEL!

for /f "tokens=*" %%i in ('git config --get quiz.apiKey 2^>nul') do set API_KEY=%%i
if defined API_KEY set OPTIONS=!OPTIONS! --api-key !API_KEY!

for /f "tokens=*" %%i in ('git config --get quiz.ollamaUrl 2^>nul') do set OLLAMA_URL=%%i
if defined OLLAMA_URL set OPTIONS=!OPTIONS! --ollama-url !OLLAMA_URL!

for /f "tokens=*" %%i in ('git config --get quiz.language 2^>nul') do set LANGUAGE=%%i
if defined LANGUAGE set OPTIONS=!OPTIONS! --language !LANGUAGE!

REM Try to run quiz-before-push
where quiz-before-push >nul 2>&1
if %errorlevel% equ 0 (
    quiz-before-push %OPTIONS%
    set EXIT_CODE=%errorlevel%
) else (
    where npx >nul 2>&1
    if %errorlevel% equ 0 (
        npx quiz-before-push %OPTIONS%
        set EXIT_CODE=%errorlevel%
    ) else (
        echo Error: quiz-before-push is not installed.
        echo Install with: npm install -g quiz-before-push
        echo Or run: npx quiz-before-push
        exit /b 1
    )
)

if not %EXIT_CODE% equ 0 (
    echo.
    echo ===============================================================
    echo                      Push Blocked
    echo   Please review the code changes and try again.
    echo ===============================================================
    echo.
    echo To skip the quiz (not recommended^):
    echo   git push --no-verify
    echo.
)

exit /b %EXIT_CODE%
