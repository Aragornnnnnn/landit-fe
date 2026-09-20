// 대화 보기의 교정·표현 재사용 판단 — 아직 만드는 중인지, 밑줄 칠 구절을 어디서 자를지
import { describe, expect, it } from 'vitest';

import type { SmallTalkHistoryMessage } from '../api/small-talk';
import { hasPendingCorrection, splitMatchedText } from './message-feedback';

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

describe('splitMatchedText', () => {
  it('원문 안의 구절을 앞·구절·뒤로 나눈다', () => {
    const split = splitMatchedText("I'm working out now.", 'working out');

    expect(split).toEqual({
      before: "I'm ",
      match: 'working out',
      after: ' now.',
    });
  });

  it('원문에 그 구절이 없으면 나누지 않는다', () => {
    expect(splitMatchedText("I'm working out now.", 'work out')).toBeNull();
  });

  it.each([
    ['없으면', undefined],
    ['비어 있으면', ''],
  ])('강조할 구절이 %s 나누지 않는다', (_, matchedText) => {
    expect(splitMatchedText("I'm working out now.", matchedText)).toBeNull();
  });
});
