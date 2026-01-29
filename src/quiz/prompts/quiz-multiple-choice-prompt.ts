import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  isUpKey,
  isDownKey,
} from '@inquirer/core';
import chalk from 'chalk';

export type MultipleChoiceResult = {
  action: 'answer' | 'chat';
  value: string;
};

export interface MultipleChoiceConfig {
  message: string;
  choices: Array<{ label: string; text: string }>;
}

const quizMultipleChoicePrompt = createPrompt<MultipleChoiceResult, MultipleChoiceConfig>((config, done) => {
  const { message, choices } = config;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [chatValue, setChatValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const chatIndex = choices.length; // 채팅 옵션은 마지막
  const isOnChat = selectedIndex === chatIndex;

  useKeypress((key, rl) => {
    if (isSubmitted) return;

    if (isEnterKey(key)) {
      setIsSubmitted(true);
      if (isOnChat) {
        done({ action: 'chat', value: chatValue });
      } else {
        done({ action: 'answer', value: choices[selectedIndex].label });
      }
    } else if (isUpKey(key)) {
      // 채팅 모드에서 위로 이동 시 입력값 저장
      if (isOnChat) {
        setChatValue(rl.line);
        rl.clearLine(0);
      }
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (isDownKey(key)) {
      // 채팅 모드로 이동 시 저장된 값 복원
      const newIndex = Math.min(chatIndex, selectedIndex + 1);
      if (newIndex === chatIndex && selectedIndex !== chatIndex) {
        rl.write(chatValue);
      }
      setSelectedIndex(newIndex);
    } else if (isOnChat) {
      // 채팅 모드에서만 입력 허용
      setChatValue(rl.line);
    }
  });

  if (isSubmitted) {
    if (isOnChat) {
      return `${chalk.green('?')} ${message}\n${chalk.green('>')} ${chalk.cyan('Chat')}: ${chatValue}`;
    } else {
      const selected = choices[selectedIndex];
      return `${chalk.green('?')} ${message}\n${chalk.green('>')} ${selected.label}) ${selected.text}`;
    }
  }

  const helpText = chalk.gray('(↑↓ 이동)');

  // 튜플 반환: [커서가 있는 줄까지, 커서 아래 표시될 내용]
  if (isOnChat) {
    // 채팅 모드: 선택지들 + 채팅 입력줄까지가 커서 위치
    const linesAboveAndCursor: string[] = [];
    linesAboveAndCursor.push(`${chalk.green('?')} ${message}`);

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const text = `${choice.label}) ${choice.text}`;
      linesAboveAndCursor.push(`  ${chalk.gray(text)}`);
    }

    linesAboveAndCursor.push(`${chalk.cyan('>')} ${chatValue}`);

    return [linesAboveAndCursor.join('\n'), helpText];
  } else {
    // 선택지 모드: 선택된 줄까지가 커서 위치
    const linesAboveAndCursor: string[] = [];
    const linesBelow: string[] = [];

    linesAboveAndCursor.push(`${chalk.green('?')} ${message}`);

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const isSelected = i === selectedIndex;
      const prefix = isSelected ? chalk.cyan('>') : ' ';
      const text = `${choice.label}) ${choice.text}`;
      const line = `${prefix} ${isSelected ? text : chalk.gray(text)}`;

      if (i <= selectedIndex) {
        linesAboveAndCursor.push(line);
      } else {
        linesBelow.push(line);
      }
    }

    // 채팅 옵션과 도움말은 아래에
    linesBelow.push(`  ${chalk.gray(chatValue || '또는 AI에게 질문하세요...')}`);
    linesBelow.push(helpText);

    return [linesAboveAndCursor.join('\n'), linesBelow.join('\n')];
  }
});

export default quizMultipleChoicePrompt;
