import { execSync } from 'child_process';
import chalk from 'chalk';
import { createProvider, type ProviderOptions } from './providers/index.js';
import { ComplexityAnalyzer } from './analyzer/complexity.js';
import { QuizManager, type QuizResult } from './quiz/manager.js';

export interface GitQuizOptions extends ProviderOptions {
  maxRetries?: number;
  passingScore?: number;
  skipQuiz?: boolean;
}

export class GitQuiz {
  private options: GitQuizOptions;
  private analyzer: ComplexityAnalyzer;

  constructor(options: GitQuizOptions) {
    this.options = options;
    this.analyzer = new ComplexityAnalyzer();
  }

  async run(): Promise<number> {
    try {
      // Skip quiz if requested
      if (this.options.skipQuiz) {
        console.log(chalk.yellow('⚠️  Quiz skipped. Proceeding without verification.\n'));
        return 0;
      }

      // Get diff based on mode
      const diff = this.getDiff();

      if (!diff || diff.trim().length === 0) {
        console.log(chalk.gray('No changes found. Nothing to quiz.\n'));
        return 0;
      }

      // Sanitize diff to remove sensitive data
      const sanitizedDiff = this.sanitizeDiff(diff);

      // Analyze complexity
      const analysis = this.analyzer.analyzeDiff(sanitizedDiff);

      console.log(chalk.cyan('📊 Diff Analysis:'));
      console.log(chalk.gray(`   Files: ${analysis.fileCount}`));
      console.log(chalk.gray(`   Lines: +${analysis.addedLines} / -${analysis.deletedLines}`));
      console.log(chalk.gray(`   Complexity: ${analysis.complexity} (${analysis.level})`));
      console.log(chalk.gray(`   Quiz Questions: ${this.analyzer.getQuizCount(analysis.complexity)}\n`));

      // Create provider
      const provider = createProvider({
        provider: this.options.provider,
        model: this.options.model,
        apiKey: this.options.apiKey,
        ollamaUrl: this.options.ollamaUrl,
        language: this.options.language,
      });

      // Generate quiz
      console.log(chalk.cyan(`🤖 Generating quiz using ${provider.getName()}...`));

      const quiz = await provider.generateQuiz(sanitizedDiff, analysis.complexity);

      // Run quiz
      const quizManager = new QuizManager(provider, {
        maxRetries: this.options.maxRetries ?? 3,
        passingScore: this.options.passingScore ?? 7,
      });

      const result = await quizManager.runQuiz(quiz, diff);

      return this.getExitCode(result);
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      } else {
        console.error(chalk.red('\n❌ An unexpected error occurred.\n'));
      }
      return 1;
    }
  }

  private getDiff(): string {
    const mode = this.options.mode || 'default';

    try {
      if (mode === 'pre-push') {
        // pre-push: 푸시할 커밋들의 변경사항
        return this.getPrePushDiff();
      }

      // default: staged + unstaged
      return execSync('git diff HEAD', {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        // Git command failed
        throw new Error('Failed to get diff. Are you in a git repository?');
      }
      throw error;
    }
  }

  private getPrePushDiff(): string {
    try {
      // upstream이 설정된 경우 (가장 일반적인 케이스)
      return execSync('git diff @{push}..HEAD', {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch {
      // upstream이 없으면 merge-base를 활용하여 분기점부터 비교
      // (직접 origin/main..HEAD 비교 시 main의 새 커밋도 diff에 포함되는 문제 방지)
      return this.getDiffFromMergeBase();
    }
  }

  private getDiffFromMergeBase(): string {
    const execOptions = {
      encoding: 'utf-8' as const,
      maxBuffer: 10 * 1024 * 1024,
    };

    // origin/main과의 merge-base 시도
    try {
      const mergeBase = execSync('git merge-base origin/main HEAD', {
        encoding: 'utf-8',
      }).trim();
      return execSync(`git diff ${mergeBase}..HEAD`, execOptions);
    } catch {
      // origin/master와의 merge-base 폴백
      try {
        const mergeBase = execSync('git merge-base origin/master HEAD', {
          encoding: 'utf-8',
        }).trim();
        return execSync(`git diff ${mergeBase}..HEAD`, execOptions);
      } catch {
        // 모든 시도 실패 시 HEAD의 전체 변경사항 반환
        return execSync('git diff HEAD', execOptions);
      }
    }
  }

  private sanitizeDiff(diff: string): string {
    // Patterns for sensitive data
    const sensitivePatterns = [
      // API keys (various formats)
      /(['"`])?(api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)\1?\s*[:=]\s*['"`]?[a-zA-Z0-9_\-]{20,}['"`]?/gi,
      // AWS credentials
      /(['"`])?(aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)\1?\s*[:=]\s*['"`]?[A-Z0-9]{16,}['"`]?/gi,
      // Bearer tokens
      /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
      // Private keys
      /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      // Passwords in common formats
      /(['"`])?(password|passwd|pwd|secret)\1?\s*[:=]\s*['"`][^'"`\n]{8,}['"`]/gi,
      // Database connection strings
      /mongodb(\+srv)?:\/\/[^\s'"]+/gi,
      /postgres(ql)?:\/\/[^\s'"]+/gi,
      /mysql:\/\/[^\s'"]+/gi,
      /redis:\/\/[^\s'"]+/gi,
      // JWT tokens
      /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
      // Generic secrets (long base64-like strings that look like secrets)
      /(['"`])?(token|auth|credential|secret)\1?\s*[:=]\s*['"`]?[a-zA-Z0-9+/]{32,}=*['"`]?/gi,
    ];

    let sanitized = diff;

    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, (match) => {
        // Keep the key name but redact the value
        const keyMatch = match.match(/^(['"`])?(\w+)\1?\s*[:=]/);
        if (keyMatch) {
          return `${keyMatch[0]} [REDACTED]`;
        }
        return '[REDACTED]';
      });
    }

    return sanitized;
  }

  private getExitCode(result: QuizResult): number {
    if (result.overallPassed) {
      console.log(chalk.green('✅ Quiz passed! Proceeding with commit.\n'));
      return 0;
    }

    if (result.bypassed) {
      console.log(chalk.yellow('⚠️  Quiz bypassed. Proceeding with caution.\n'));
      return 0;
    }

    console.log(chalk.red('🚫 Quiz failed. Commit blocked.\n'));
    return 1;
  }
}

// Export types and classes for programmatic use
export { createProvider, type ProviderOptions } from './providers/index.js';
export { ComplexityAnalyzer, type DiffAnalysis } from './analyzer/complexity.js';
export { QuizManager, type QuizResult, type QuizManagerOptions } from './quiz/manager.js';
export * from './types/index.js';
