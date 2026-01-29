import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  isUpKey,
  isDownKey,
} from '@inquirer/core';
import chalk from 'chalk';

export type QuizChatResult = {
  action: 'question' | 'exit';
  value: string;
};

const quizChatPrompt = createPrompt<QuizChatResult, object>((config, done) => {
  const [mode, setMode] = useState<'question' | 'exit'>('question');
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useKeypress((key, rl) => {
    if (isSubmitted) return;

    if (isEnterKey(key)) {
      setIsSubmitted(true);
      done({ action: mode, value: mode === 'question' ? inputValue : '' });
    } else if (isUpKey(key) || isDownKey(key)) {
      // Mode toggle
      setMode(mode === 'question' ? 'exit' : 'question');
      // Keep the cursor at the end of input in question mode
      if (mode === 'exit') {
        rl.write(inputValue);
      }
    } else if (mode === 'question') {
      // Update input value from readline
      setInputValue(rl.line);
    }
  });

  if (isSubmitted) {
    if (mode === 'question') {
      return `${chalk.green('✔')} ${chalk.blue('You')}: ${inputValue}`;
    } else {
      return `${chalk.green('✔')} ${chalk.cyan('Returning to answer mode')}`;
    }
  }

  const questionLine = mode === 'question'
    ? `${chalk.cyan('❯')} 💬 ${inputValue || chalk.gray('질문을 입력하세요...')}${inputValue ? chalk.inverse(' ') : ''}`
    : `  💬 ${inputValue || chalk.gray('질문을 입력하세요...')}`;

  const exitLine = mode === 'exit'
    ? `${chalk.cyan('❯')} ✏️  ${chalk.bold('정답 입력 모드로 전환')}`
    : `  ✏️  정답 입력 모드로 전환`;

  const helpLine = chalk.gray('\n↑↓ 이동 • ⏎ 선택');

  return `${questionLine}\n${exitLine}${helpLine}`;
});

export default quizChatPrompt;
