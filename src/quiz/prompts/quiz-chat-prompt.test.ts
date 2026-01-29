import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import quizChatPrompt from './quiz-chat-prompt.js';

describe('quiz-chat-prompt', () => {
  it('allows typing question and submitting', async () => {
    const { answer, events } = await render(quizChatPrompt, {});

    events.type('이 코드가 뭐하는 건가요?');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'question',
      value: '이 코드가 뭐하는 건가요?'
    });
  });

  it('switches to exit mode with down arrow', async () => {
    const { answer, events } = await render(quizChatPrompt, {});

    events.keypress('down');  // exit으로 이동
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'exit',
      value: ''
    });
  });

  it('can return to question mode with up arrow', async () => {
    const { answer, events } = await render(quizChatPrompt, {});

    events.keypress('down');  // exit으로 이동
    events.keypress('up');    // question으로 복귀
    events.type('질문입니다');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'question',
      value: '질문입니다'
    });
  });

  it('submits empty question when no input provided', async () => {
    const { answer, events } = await render(quizChatPrompt, {});

    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'question',
      value: ''
    });
  });
});
