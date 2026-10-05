// 대화 보기의 교정 판단 — 아직 만드는 중인지
import { describe, expect, it } from 'vitest';

import type { SmallTalkHistoryMessage } from '../api/small-talk';
import { hasPendingCorrection } from './message-feedback';

const messageOf = (
  overrides: Partial<SmallTalkHistoryMessage>,
): SmallTalkHistoryMessage => ({
  messageId: 1,
  turnNumber: 1,
  messageSequence: 1,
  role: 'USER',
  content: 'Hi.',
  translatedContent: null,
  emotion: null,
  innerThought: null,
  innerThoughtType: null,
  ...overrides,
});

describe('hasPendingCorrection', () => {
  it('아직 만드는 중인 교정이 하나라도 있으면 참이다', () => {
    const messages = [
      messageOf({ messageId: 1, correctionStatus: 'COMPLETED' }),
      messageOf({ messageId: 2, correctionStatus: 'PREPARING' }),
    ];

    expect(hasPendingCorrection(messages)).toBe(true);
  });

  it('교정이 전부 끝났거나 실패했으면 거짓이다', () => {
    const messages = [
      messageOf({ messageId: 1, correctionStatus: 'COMPLETED' }),
      messageOf({ messageId: 2, correctionStatus: 'FAILED' }),
      // AI 메시지엔 필드 자체가 없다
      messageOf({ messageId: 3, role: 'AI' }),
    ];

    expect(hasPendingCorrection(messages)).toBe(false);
  });
});
