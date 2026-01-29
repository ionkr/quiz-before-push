import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  isUpKey,
  isDownKey,
} from '@inquirer/core';
import chalk from 'chalk';

export type QuizAnswerResult = {
  action: 'answer' | 'chat';
  value: string;
};

const quizAnswerPrompt = createPrompt<QuizAnswerResult, object>((config, done) => {
  const [mode, setMode] = useState<'answer' | 'chat'>('answer');
  const [answerValue, setAnswerValue] = useState('');
  const [chatValue, setChatValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useKeypress((key, rl) => {
    if (isSubmitted) return;

    if (isEnterKey(key)) {
      setIsSubmitted(true);
      done({ action: mode, value: mode === 'answer' ? answerValue : chatValue });
    } else if (isUpKey(key) || isDownKey(key)) {
      // Mode toggle - save current input before switching
      const currentInput = rl.line;
      if (mode === 'answer') {
        setAnswerValue(currentInput);
      } else {
        setChatValue(currentInput);
      }

      // Clear readline and set the other mode's value
      const newMode = mode === 'answer' ? 'chat' : 'answer';
      const newValue = newMode === 'answer' ? answerValue : chatValue;

      // Clear current line by removing characters one by one
      rl.clearLine(0);
      // Write saved value for new mode
      rl.write(newValue);

      setMode(newMode);
    } else {
      // Update input value from readline for current mode
      if (mode === 'answer') {
        setAnswerValue(rl.line);
      } else {
        setChatValue(rl.line);
      }
    }
  });

  if (isSubmitted) {
    if (mode === 'answer') {
      return `${chalk.green('>')} ${chalk.bold('Answer')}: ${answerValue}`;
    } else {
      return `${chalk.green('>')} ${chalk.cyan('Chat')}: ${chatValue}`;
    }
  }

  const helpText = chalk.gray('(↑↓ 전환)');

  // 튜플 반환: [커서가 있는 줄, 커서 아래 표시될 내용]
  if (mode === 'answer') {
    const inputLine = `${chalk.cyan('>')} ${answerValue}`;
    const belowCursor = `  ${chalk.gray(chatValue || '또는 AI에게 질문하세요...')}\n${helpText}`;
    return [inputLine, belowCursor];
  } else {
    const aboveAndInput = `  ${chalk.gray(answerValue || '답변을 입력하세요...')}\n${chalk.cyan('>')} ${chatValue}`;
    const belowCursor = helpText;
    return [aboveAndInput, belowCursor];
  }
});

export default quizAnswerPrompt;
