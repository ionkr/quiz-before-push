import chalk from 'chalk';
import ora from 'ora';
import select from '@inquirer/select';
import input from '@inquirer/input';
import confirm from '@inquirer/confirm';
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

  constructor(provider: AIProvider, options: Partial<QuizManagerOptions> = {}) {
    this.provider = provider;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async runQuiz(quiz: Quiz, diff?: string): Promise<QuizResult> {
    const results: QuizResult['results'] = [];
    let failureCount = 0;

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

        let evaluation: EvaluationResult;

        // 객관식이고 correctChoiceLabel이 있으면 로컬 평가 (API 호출 없음)
        if (question.type === 'MULTIPLE_CHOICE' && question.correctChoiceLabel) {
          evaluation = this.evaluateMultipleChoice(question, answer);
          lastEvaluation = evaluation;
          this.displayEvaluation(evaluation);
        } else {
          // 서술형이거나 correctChoiceLabel이 없으면 AI 평가
          const spinner = ora('Evaluating your answer...').start();

          try {
            evaluation = await this.provider.evaluateAnswer(question, answer);
            lastEvaluation = evaluation;
            spinner.stop();

            this.displayEvaluation(evaluation);
          } catch (error) {
            spinner.fail('Failed to evaluate answer');
            throw error;
          }
        }

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
      'Do you want to bypass the quiz and proceed anyway? (This is not recommended)'
    );

    if (bypass) {
      console.log(chalk.yellow('\n⚠️  Quiz bypassed. Please review the changes carefully!\n'));
      return true;
    }

    console.log(chalk.red('\n🚫 Operation blocked. Please understand the changes before proceeding.\n'));
    return false;
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

  private evaluateMultipleChoice(question: Question, answer: string): EvaluationResult {
    const isCorrect = answer === question.correctChoiceLabel;

    if (isCorrect) {
      return {
        score: 10,
        passed: true,
        feedback: question.correctFeedback || 'Correct!',
        correctAnswer: question.correctChoiceLabel,
      };
    } else {
      return {
        score: 0,
        passed: false,
        feedback: question.incorrectFeedback || `Incorrect. The correct answer is ${question.correctChoiceLabel}.`,
        correctAnswer: question.correctChoiceLabel,
      };
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
    }
  }

  private async getAnswer(question: Question): Promise<string> {
    if (question.type === 'MULTIPLE_CHOICE' && question.choices) {
      return this.getMultipleChoiceAnswer(question);
    }

    // 서술형 입력도 inquirer 사용 (readline과 충돌 방지)
    try {
      const answer = await input({
        message: 'Your answer:',
      });
      return answer.trim();
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log(chalk.yellow('\n\nQuiz cancelled.'));
        process.exit(1);
      }
      throw error;
    }
  }

  private async askYesNo(message: string): Promise<boolean> {
    try {
      return await confirm({
        message: message,
        default: false,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') {
        console.log(chalk.yellow('\n\nQuiz cancelled.'));
        process.exit(1);
      }
      throw error;
    }
  }
}
