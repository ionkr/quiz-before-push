import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import select from '@inquirer/select';
import type { AIProvider } from '../providers/types.js';
import type { Quiz, Question, EvaluationResult } from '../types/index.js';

export interface QuizResult {
  totalQuestions: number;
  passedQuestions: number;
  failedQuestions: number;
  results: Array<{
    question: Question;
    answer: string;
    evaluation: EvaluationResult;
  }>;
  overallPassed: boolean;
  bypassed: boolean;
}

export interface QuizManagerOptions {
  maxRetries: number;
  passingScore: number;
  showDiffOnBypass: boolean;
}

const DEFAULT_OPTIONS: QuizManagerOptions = {
  maxRetries: 3,
  passingScore: 7,
  showDiffOnBypass: true,
};

export class QuizManager {
  private provider: AIProvider;
  private options: QuizManagerOptions;
  private rl: readline.Interface | null = null;

  constructor(provider: AIProvider, options: Partial<QuizManagerOptions> = {}) {
    this.provider = provider;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async runQuiz(quiz: Quiz, diff?: string): Promise<QuizResult> {
    const results: QuizResult['results'] = [];
    let failureCount = 0;

    this.initReadline();

    console.log(chalk.bold.cyan('\n📝 Code Review Quiz'));
    console.log(chalk.gray(`Complexity: ${quiz.complexity} | Questions: ${quiz.questions.length}\n`));

    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i];
      let passed = false;
      let lastEvaluation: EvaluationResult | null = null;
      let lastAnswer = '';

      while (!passed && failureCount < this.options.maxRetries) {
        this.displayQuestion(question, i + 1, quiz.questions.length);

        const answer = await this.getAnswer(question);
        lastAnswer = answer;

        const spinner = ora('Evaluating your answer...').start();

        try {
          const evaluation = await this.provider.evaluateAnswer(question, answer);
          lastEvaluation = evaluation;
          spinner.stop();

          this.displayEvaluation(evaluation);

          if (evaluation.passed) {
            passed = true;
          } else {
            failureCount++;
            if (failureCount < this.options.maxRetries) {
              console.log(
                chalk.yellow(`\n⚠️  Attempts remaining: ${this.options.maxRetries - failureCount}`)
              );
              console.log(chalk.gray('Try again with a more detailed answer.\n'));
            }
          }
        } catch (error) {
          spinner.fail('Failed to evaluate answer');
          throw error;
        }
      }

      if (lastEvaluation) {
        results.push({
          question,
          answer: lastAnswer,
          evaluation: lastEvaluation,
        });
      }

      // Check if we've hit max failures
      if (failureCount >= this.options.maxRetries && !passed) {
        const bypassed = await this.handleFailure(diff);
        this.closeReadline();

        return {
          totalQuestions: quiz.questions.length,
          passedQuestions: results.filter((r) => r.evaluation.passed).length,
          failedQuestions: results.filter((r) => !r.evaluation.passed).length,
          results,
          overallPassed: false,
          bypassed,
        };
      }
    }

    this.closeReadline();

    const passedCount = results.filter((r) => r.evaluation.passed).length;
    const overallPassed = passedCount === quiz.questions.length;

    this.displayFinalResult(passedCount, quiz.questions.length, overallPassed);

    return {
      totalQuestions: quiz.questions.length,
      passedQuestions: passedCount,
      failedQuestions: results.filter((r) => !r.evaluation.passed).length,
      results,
      overallPassed,
      bypassed: false,
    };
  }

  async handleFailure(diff?: string): Promise<boolean> {
    console.log(chalk.red.bold('\n❌ Maximum retry attempts reached!'));
    console.log(chalk.gray('You have failed too many questions.\n'));

    if (this.options.showDiffOnBypass && diff) {
      const showDiff = await this.askYesNo(
        'Would you like to review the diff before deciding?'
      );

      if (showDiff) {
        console.log(chalk.cyan('\n--- Diff Start ---'));
        console.log(diff);
        console.log(chalk.cyan('--- Diff End ---\n'));
      }
    }

    const bypass = await this.askYesNo(
      chalk.yellow('Do you want to bypass the quiz and proceed anyway?') +
        chalk.red(' (This is not recommended)')
    );

    if (bypass) {
      console.log(chalk.yellow('\n⚠️  Quiz bypassed. Please review the changes carefully!\n'));
      return true;
    }

    console.log(chalk.red('\n🚫 Operation blocked. Please understand the changes before proceeding.\n'));
    return false;
  }

  private initReadline(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private closeReadline(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  private displayQuestion(question: Question, current: number, total: number): void {
    console.log(chalk.bold(`\nQuestion ${current}/${total}`));

    if (question.context) {
      console.log(chalk.gray(`Context: ${question.context}`));
    }

    // MULTIPLE_CHOICE가 아닐 때만 질문 텍스트 출력 (select가 message로 표시)
    if (question.type !== 'MULTIPLE_CHOICE') {
      console.log(chalk.white(`\n${question.question}\n`));
    }
  }

  private displayEvaluation(evaluation: EvaluationResult): void {
    const scoreColor = evaluation.passed ? chalk.green : chalk.red;
    const icon = evaluation.passed ? '✓' : '✗';

    console.log(`\n${scoreColor(icon)} Score: ${evaluation.score}/10`);
    console.log(chalk.gray(`Feedback: ${evaluation.feedback}`));

    if (!evaluation.passed && evaluation.correctAnswer) {
      console.log(chalk.yellow(`Expected: ${evaluation.correctAnswer}`));
    }
  }

  private displayFinalResult(passed: number, total: number, overallPassed: boolean): void {
    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('        Quiz Results'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    const percentage = Math.round((passed / total) * 100);

    if (overallPassed) {
      console.log(chalk.green.bold('🎉 Congratulations! You passed!'));
    } else {
      console.log(chalk.red.bold('❌ Quiz not passed'));
    }

    console.log(chalk.white(`\nScore: ${passed}/${total} (${percentage}%)\n`));
  }

  private async getMultipleChoiceAnswer(question: Question): Promise<string> {
    // readline 충돌 방지
    this.closeReadline();

    const choices = question.choices!.map(choice => ({
      value: choice.label,
      name: `${choice.label}) ${choice.text}`,
    }));

    try {
      const answer = await select({
        message: question.question,
        choices: choices,
        loop: true,
      });
      return answer;
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log(chalk.yellow('\n\nQuiz cancelled.'));
        process.exit(1);
      }
      throw error;
    } finally {
      // 다음 질문을 위해 readline 재초기화
      this.initReadline();
    }
  }

  private async getAnswer(question: Question): Promise<string> {
    if (question.type === 'MULTIPLE_CHOICE' && question.choices) {
      return this.getMultipleChoiceAnswer(question);
    }

    const prompt = chalk.cyan('Your answer: ');
    return this.prompt(prompt);
  }

  private async askYesNo(message: string): Promise<boolean> {
    const answer = await this.prompt(`${message} ${chalk.gray('(y/n)')}: `);
    return answer.toLowerCase().startsWith('y');
  }

  private prompt(message: string): Promise<string> {
    return new Promise((resolve) => {
      if (!this.rl) {
        this.initReadline();
      }
      this.rl!.question(message, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}
