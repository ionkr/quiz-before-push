import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import quizMultipleChoicePrompt from './quiz-multiple-choice-prompt.js';

const defaultConfig = {
  message: '다음 중 올바른 것은?',
  choices: [
    { label: 'A', text: '선택지 1' },
    { label: 'B', text: '선택지 2' },
    { label: 'C', text: '선택지 3' },
  ],
};

describe('quiz-multiple-choice-prompt', () => {
  it('selects first choice by default and submits with enter', async () => {
    const { answer, events } = await render(quizMultipleChoicePrompt, defaultConfig);

    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: 'A'
    });
  });

  it('navigates to second choice with down arrow', async () => {
    const { answer, events } = await render(quizMultipleChoicePrompt, defaultConfig);

    events.keypress('down');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: 'B'
    });
  });

  it('navigates to chat option and submits empty', async () => {
    const { answer, events } = await render(quizMultipleChoicePrompt, defaultConfig);

    // 3번 down으로 채팅 옵션으로 이동 (A -> B -> C -> chat)
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'chat',
      value: ''
    });
  });

  it('allows typing question in chat mode', async () => {
    const { answer, events } = await render(quizMultipleChoicePrompt, defaultConfig);

    // 채팅 옵션으로 이동
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    events.type('이 코드가 뭔가요?');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'chat',
      value: '이 코드가 뭔가요?'
    });
  });

  it('preserves chat input when navigating back and forth', async () => {
    const { answer, events } = await render(quizMultipleChoicePrompt, defaultConfig);

    // 채팅 옵션으로 이동하고 입력
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    events.type('질문입니다');

    // 위로 이동했다가 다시 내려오기
    events.keypress('up');
    events.keypress('down');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'chat',
      value: '질문입니다'
    });
  });

  it('can return to choice after visiting chat', async () => {
    const { answer, events } = await render(quizMultipleChoicePrompt, defaultConfig);

    // 채팅으로 갔다가 다시 C 선택
    events.keypress('down');
    events.keypress('down');
    events.keypress('down'); // chat
    events.keypress('up');   // C
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: 'C'
    });
  });
});
