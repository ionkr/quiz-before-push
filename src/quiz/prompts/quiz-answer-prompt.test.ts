import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import quizAnswerPrompt from './quiz-answer-prompt.js';

describe('quiz-answer-prompt', () => {
  it('allows typing answer and submitting', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.type('테스트 답변');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: '테스트 답변'
    });
  });

  it('switches to chat mode with down arrow', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.keypress('down');  // chat으로 이동
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'chat',
      value: ''
    });
  });

  it('can return to answer mode with up arrow', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.keypress('down');  // chat으로 이동
    events.keypress('up');    // answer로 복귀
    events.type('답변');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: '답변'
    });
  });

  it('submits empty answer when no input provided', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: ''
    });
  });

  it('allows typing question in chat mode and submitting', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.keypress('down');  // chat으로 이동
    events.type('이 코드가 무엇인가요?');
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'chat',
      value: '이 코드가 무엇인가요?'
    });
  });

  it('submits empty chat value when no input in chat mode', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.keypress('down');  // chat으로 이동
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'chat',
      value: ''
    });
  });

  it('preserves input values when switching between modes', async () => {
    const { answer, events } = await render(quizAnswerPrompt, {});

    events.type('답변 내용');
    events.keypress('down');  // chat으로 이동
    events.type('질문 내용');
    events.keypress('up');    // answer로 복귀
    events.keypress('enter');

    await expect(answer).resolves.toEqual({
      action: 'answer',
      value: '답변 내용'
    });
  });
});
