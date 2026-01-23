import * as fs from 'fs';
import * as tty from 'tty';
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
  private ttyInput: tty.ReadStream | NodeJS.ReadStream | null = null;
  private ttyOutput: NodeJS.WriteStream | null = null;
  private ttyInputFd: number | null = null;

  constructor(provider: AIProvider, options: Partial<QuizManagerOptions> = {}) {
    this.provider = provider;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Git hook 환경에서 TTY를 확보합니다.
   * process.stdin이 TTY가 아닌 경우 /dev/tty를 직접 엽니다.
   * 출력은 항상 process.stdout을 사용하여 console.log와 일관성 유지.
   */
  private initTTY(): void {
    // 출력은 항상 process.stdout 사용 (console.log와 동기화)
    this.ttyOutput = process.stdout;

    if (process.stdin.isTTY) {
      // 이미 TTY인 경우 (직접 실행)
      this.ttyInput = process.stdin;
    } else {
      // Git hook 등에서 실행되어 stdin이 TTY가 아닌 경우
      try {
        // /dev/tty를 읽기 모드로 열어 입력 스트림 생성
        this.ttyInputFd = fs.openSync('/dev/tty', 'r');
        // tty.ReadStream을 사용해야 raw mode가 작동함
        this.ttyInput = new tty.ReadStream(this.ttyInputFd);
      } catch {
        // /dev/tty를 열 수 없는 경우 (CI 환경 등)
        console.error(chalk.red('Error: Cannot access terminal. Interactive mode requires a TTY.'));
        console.error(chalk.yellow('If running in CI/CD, use --skip-quiz flag.'));
        process.exit(1);
      }
    }
  }

  private closeTTY(): void {
    // /dev/tty를 직접 연 경우에만 닫기
    if (this.ttyInput && this.ttyInput !== process.stdin) {
      try {
        (this.ttyInput as tty.ReadStream).destroy();
      } catch {
        // ignore
      }
    }
    if (this.ttyInputFd !== null) {
      try {
        fs.closeSync(this.ttyInputFd);
      } catch {
        // ignore
      }
      this.ttyInputFd = null;
    }
    this.ttyInput = null;
    this.ttyOutput = null;
  }

  /**
   * TTY 입력 스트림 상태를 다음 prompt를 위해 준비합니다.
   * @inquirer/prompts 완료 후 readline이 스트림을 pause 상태로 남기므로,
   * 다음 prompt 전에 스트림을 resume하고 버퍼를 비워야 합니다.
   */
  private async prepareInputForNextPrompt(): Promise<void> {
    if (!this.ttyInput) return;

    return new Promise(resolve => {
      // 이벤트 루프를 돌려 pending 이벤트 처리
      setTimeout(() => {
        if (this.ttyInput) {
          // 이전 prompt에서 pause된 스트림을 resume
          this.ttyInput.resume();

          // raw mode 재설정 (custom input stream 사용 시 필요)
          if ('setRawMode' in this.ttyInput && typeof this.ttyInput.setRawMode === 'function') {
            try {
              this.ttyInput.setRawMode(true);
            } catch {
              // setRawMode 실패 시 무시 (process.stdin이 아닐 때 발생 가능)
            }
          }

          // 버퍼에 남아있는 데이터 drain
          this.ttyInput.pause();
          while (this.ttyInput.read() !== null) {
            // 버퍼 비우기
          }
          this.ttyInput.resume();
        }
        resolve();
      }, 10); // 약간의 딜레이로 이벤트 처리 시간 확보
    });
  }

  async runQuiz(quiz: Quiz, diff?: string): Promise<QuizResult> {
    const results: QuizResult['results'] = [];
    const maxAttempts = this.options.maxRetries;
    const passingPercentage = 0.6; // 60% 이상 정답 시 통과

    // TTY 초기화 (git hook 환경 지원)
    this.initTTY();

    console.log(chalk.bold.cyan('\n📝 Code Review Quiz'));
    console.log(chalk.gray(`Complexity: ${quiz.complexity} | Questions: ${quiz.questions.length}\n`));

    try {
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        let passed = false;
        let lastEvaluation: EvaluationResult | null = null;
        let lastAnswer = '';
        let attemptCount = 0; // 문제별 시도 횟수

        while (!passed && attemptCount < maxAttempts) {
          attemptCount++;
          const isLastAttempt = attemptCount >= maxAttempts;

          this.displayQuestion(question, i + 1, quiz.questions.length);

          // 다음 prompt를 위해 입력 스트림 준비 (버퍼 비우기 + 상태 복구)
          await this.prepareInputForNextPrompt();

          const answer = await this.getAnswer(question);
          lastAnswer = answer;

          let evaluation: EvaluationResult;

          // 객관식이고 correctChoiceLabel이 있으면 로컬 평가 (API 호출 없음)
          if (question.type === 'MULTIPLE_CHOICE' && question.correctChoiceLabel) {
            evaluation = this.evaluateMultipleChoice(question, answer, isLastAttempt);
            lastEvaluation = evaluation;
            this.displayEvaluation(evaluation, isLastAttempt);
          } else {
            // 서술형이거나 correctChoiceLabel이 없으면 AI 평가
            const spinner = ora('Evaluating your answer...').start();

            try {
              evaluation = await this.provider.evaluateAnswer(
                question,
                answer,
                attemptCount,
                maxAttempts
              );
              lastEvaluation = evaluation;
              spinner.stop();

              this.displayEvaluation(evaluation, isLastAttempt);
            } catch (error) {
              spinner.fail('Failed to evaluate answer');
              throw error;
            }
          }

          if (evaluation.passed) {
            passed = true;
          } else if (!isLastAttempt) {
            console.log(
              chalk.yellow(`\n⚠️  Attempts remaining: ${maxAttempts - attemptCount}`)
            );
          }
        }

        // 문제별 결과 저장
        if (lastEvaluation) {
          results.push({
            question,
            answer: lastAnswer,
            evaluation: lastEvaluation,
          });
        }

        // 3회 시도 후 정답 공개하고 다음 문제로 자동 진행
        if (!passed) {
          console.log(chalk.gray('\n→ Moving to next question...\n'));
        }
      }

      // 전체 정답률로 통과 판정
      const passedCount = results.filter((r) => r.evaluation.passed).length;
      const percentage = passedCount / quiz.questions.length;
      const overallPassed = percentage >= passingPercentage;

      this.displayFinalResult(passedCount, quiz.questions.length, overallPassed);

      // 통과하지 못한 경우 우회 옵션 제공
      if (!overallPassed) {
        const bypassed = await this.handleFailure(diff);

        return {
          totalQuestions: quiz.questions.length,
          passedQuestions: passedCount,
          failedQuestions: results.filter((r) => !r.evaluation.passed).length,
          results,
          overallPassed: false,
          bypassed,
        };
      }

      return {
        totalQuestions: quiz.questions.length,
        passedQuestions: passedCount,
        failedQuestions: results.filter((r) => !r.evaluation.passed).length,
        results,
        overallPassed,
        bypassed: false,
      };
    } finally {
      this.closeTTY();
    }
  }

  async handleFailure(diff?: string): Promise<boolean> {
    console.log(chalk.red.bold('\n❌ Quiz not passed!'));
    console.log(chalk.gray('You need at least 60% correct answers to pass.\n'));

    if (this.options.showDiffOnBypass && diff) {
      await this.prepareInputForNextPrompt();
      const showDiff = await this.askYesNo(
        'Would you like to review the diff before deciding?'
      );

      if (showDiff) {
        console.log(chalk.cyan('\n--- Diff Start ---'));
        console.log(diff);
        console.log(chalk.cyan('--- Diff End ---\n'));
      }
    }

    await this.prepareInputForNextPrompt();
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

  private evaluateMultipleChoice(question: Question, answer: string, isLastAttempt: boolean = false): EvaluationResult {
    const isCorrect = answer === question.correctChoiceLabel;

    if (isCorrect) {
      return {
        score: 10,
        passed: true,
        feedback: question.correctFeedback || 'Correct!',
        correctAnswer: question.correctChoiceLabel,
      };
    } else {
      // 객관식은 힌트 없이 재시도, 마지막 시도에만 정답 공개
      return {
        score: 0,
        passed: false,
        feedback: isLastAttempt
          ? (question.incorrectFeedback || 'Incorrect.')
          : 'Incorrect. Try again!',
        correctAnswer: isLastAttempt ? question.correctChoiceLabel : undefined,
      };
    }
  }

  private displayEvaluation(evaluation: EvaluationResult, isLastAttempt: boolean = false): void {
    const scoreColor = evaluation.passed ? chalk.green : chalk.red;
    const icon = evaluation.passed ? '✓' : '✗';

    console.log(`\n${scoreColor(icon)} Score: ${evaluation.score}/10`);
    console.log(chalk.gray(`Feedback: ${evaluation.feedback}`));

    if (!evaluation.passed) {
      // 힌트가 있고 마지막 시도가 아니면 힌트 표시
      if (evaluation.hint && !isLastAttempt) {
        console.log(chalk.cyan(`💡 Hint: ${evaluation.hint}`));
      }
      // 마지막 시도거나 정답이 있으면 정답 표시
      if (isLastAttempt && evaluation.correctAnswer) {
        console.log(chalk.yellow(`✓ Answer: ${evaluation.correctAnswer}`));
      }
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
      }, {
        input: this.ttyInput!,
        output: this.ttyOutput!,
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

    // 서술형 입력
    try {
      const answer = await input({
        message: 'Your answer:',
      }, {
        input: this.ttyInput!,
        output: this.ttyOutput!,
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
      }, {
        input: this.ttyInput!,
        output: this.ttyOutput!,
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
