#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { GitQuiz } from './index.js';

const program = new Command();

interface GitQuizCliOptions {
  provider: 'openai' | 'ollama' | 'claude-code' | 'anthropic';
  model?: string;
  apiKey?: string;
  ollamaUrl?: string;
  language?: string;
  mode?: 'default' | 'pre-push';
  skipQuiz?: boolean;
  installHooks?: boolean;
}

function getGitConfig(key: string): string | undefined {
  try {
    const value = execSync(`git config --get quiz.${key}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function loadGitConfigDefaults(): Partial<GitQuizCliOptions> {
  return {
    provider: getGitConfig('provider') as GitQuizCliOptions['provider'] | undefined,
    model: getGitConfig('model'),
    apiKey: getGitConfig('apiKey'),
    ollamaUrl: getGitConfig('ollamaUrl'),
    language: getGitConfig('language'),
  };
}

function installGitHooks(): void {
  try {
    // Find git directory
    const gitDir = execSync('git rev-parse --git-dir', {
      encoding: 'utf-8',
    }).trim();

    const hooksDir = join(gitDir, 'hooks');

    // Create hooks directory if it doesn't exist
    if (!existsSync(hooksDir)) {
      mkdirSync(hooksDir, { recursive: true });
    }

    // Pre-push hook content
    const prePushHook = `#!/bin/sh
# review-before-go pre-push hook
# This hook runs before git push to ensure code understanding

# Check if quiz is enabled
QUIZ_ENABLED=$(git config --get quiz.enabled)
if [ "$QUIZ_ENABLED" != "true" ]; then
  exit 0
fi

echo "Running review-before-go..."

# Run the quiz with pre-push mode
if command -v review-before-go &> /dev/null; then
  review-before-go --mode pre-push
else
  # Fallback to npx if review-before-go is not installed globally
  npx review-before-go --mode pre-push
fi

exit $?
`;

    const prePushPath = join(hooksDir, 'pre-push');

    // Check if hook already exists
    if (existsSync(prePushPath)) {
      console.log(chalk.yellow('⚠️  pre-push hook already exists.'));
      console.log(chalk.gray('   To enable review-before-go, add it to your existing hook or run:'));
      console.log(chalk.cyan('   git config quiz.enabled true\n'));
      return;
    }

    // Write the hook
    writeFileSync(prePushPath, prePushHook, { encoding: 'utf-8' });
    chmodSync(prePushPath, '755');

    console.log(chalk.green('✅ Git hook installed successfully!'));
    console.log(chalk.gray('\nTo enable the quiz, run:'));
    console.log(chalk.cyan('  git config quiz.enabled true'));
    console.log(chalk.gray('\nOptional configuration:'));
    console.log(chalk.cyan('  git config quiz.provider openai'));
    console.log(chalk.cyan('  git config quiz.model gpt-4o-mini'));
    console.log(chalk.cyan('  git config quiz.language ko\n'));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`❌ Failed to install hooks: ${error.message}`));
    }
    process.exit(1);
  }
}

program
  .name('review-before-go')
  .description('AI-powered code review quiz to ensure developers understand code changes')
  .version('0.1.0')
  .option(
    '-p, --provider <provider>',
    'AI provider to use (openai, ollama, claude-code, anthropic)'
  )
  .option('-m, --model <model>', 'Model to use for the provider')
  .option('-k, --api-key <key>', 'API key (or set OPENAI_API_KEY/ANTHROPIC_API_KEY env var)')
  .option('-u, --ollama-url <url>', 'Ollama server URL')
  .option('-l, --language <lang>', 'Language for quiz questions (e.g., en, ko, ja)')
  .option('--mode <mode>', 'Diff mode: default (staged+unstaged) or pre-push (commits to push)', 'default')
  .option('-s, --skip-quiz', 'Skip the quiz (dangerous, not recommended)')
  .option('--install-hooks', 'Install git hooks for automatic quiz on push')
  .action(async (options: GitQuizCliOptions) => {
    // Handle --install-hooks
    if (options.installHooks) {
      installGitHooks();
      return;
    }

    // Load git config defaults
    const gitConfigDefaults = loadGitConfigDefaults();

    // Merge options (CLI > git config > defaults)
    const provider = options.provider || gitConfigDefaults.provider || 'openai';
    const getDefaultApiKey = (p: string) => {
      if (p === 'anthropic') return process.env.ANTHROPIC_API_KEY;
      return process.env.OPENAI_API_KEY;
    };
    const finalOptions: GitQuizCliOptions = {
      provider,
      model: options.model || gitConfigDefaults.model,
      apiKey: options.apiKey || gitConfigDefaults.apiKey || getDefaultApiKey(provider),
      ollamaUrl: options.ollamaUrl || gitConfigDefaults.ollamaUrl || 'http://localhost:11434',
      language: options.language || gitConfigDefaults.language,
      mode: (options.mode as 'default' | 'pre-push') || 'default',
      skipQuiz: options.skipQuiz,
    };

    // Validate provider
    const validProviders = ['openai', 'ollama', 'claude-code', 'anthropic'];
    if (!validProviders.includes(finalOptions.provider)) {
      console.error(chalk.red(`❌ Invalid provider: ${finalOptions.provider}`));
      console.error(chalk.gray(`   Valid providers: ${validProviders.join(', ')}`));
      process.exit(1);
    }

    // Validate mode
    const validModes = ['default', 'pre-push'];
    if (finalOptions.mode && !validModes.includes(finalOptions.mode)) {
      console.error(chalk.red(`❌ Invalid mode: ${finalOptions.mode}`));
      console.error(chalk.gray(`   Valid modes: ${validModes.join(', ')}`));
      process.exit(1);
    }

    // Warn about skip-quiz
    if (finalOptions.skipQuiz) {
      console.log(chalk.red.bold('⚠️  WARNING: Quiz is being skipped!'));
      console.log(chalk.yellow('   This defeats the purpose of code review verification.\n'));
    }

    // Run the quiz
    const gitQuiz = new GitQuiz({
      provider: finalOptions.provider as 'openai' | 'ollama' | 'claude-code' | 'anthropic',
      model: finalOptions.model,
      apiKey: finalOptions.apiKey,
      ollamaUrl: finalOptions.ollamaUrl,
      language: finalOptions.language,
      mode: finalOptions.mode,
      skipQuiz: finalOptions.skipQuiz,
    });

    const exitCode = await gitQuiz.run();
    process.exit(exitCode);
  });

program.parse();
