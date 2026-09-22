// 답안 제출 멱등 키 — 어느 때 같은 id를 다시 쓰고, 어느 때 새로 만드는가
import { describe, expect, it } from 'vitest';

import { submissionFor } from './review-submission';

const newId = () => 'new-id';

describe('답안 제출 멱등 키', () => {
  it('보낸 적 없으면 새 제출 id를 만든다', () => {
    const submission = submissionFor(null, 'q1', ['I', 'win'], newId);

    expect(submission).toEqual({
      submissionId: 'new-id',
      questionId: 'q1',
      words: ['I', 'win'],
    });
  });

  it('같은 문제에 같은 단어열을 다시 보내면 제출 id를 그대로 쓴다', () => {
    const pending = {
      submissionId: 'old-id',
      questionId: 'q1',
      words: ['I', 'win'],
    };

    const submission = submissionFor(pending, 'q1', ['I', 'win'], newId);

    expect(submission.submissionId).toBe('old-id');
  });

  it('단어 순서가 바뀌면 새 시도라 제출 id를 새로 만든다', () => {
    const pending = {
      submissionId: 'old-id',
      questionId: 'q1',
      words: ['I', 'win'],
    };

    const submission = submissionFor(pending, 'q1', ['win', 'I'], newId);

    expect(submission.submissionId).toBe('new-id');
  });

  it('다른 문제면 새 제출 id를 만든다', () => {
    const pending = {
      submissionId: 'old-id',
      questionId: 'q1',
      words: ['I', 'win'],
    };

    const submission = submissionFor(pending, 'q2', ['I', 'win'], newId);

    expect(submission.submissionId).toBe('new-id');
  });
});
