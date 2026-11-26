// toMyBubbleState — 단계·확인·입력·실패 조합마다 내 말풍선이 어떤 상태인지 검증한다
import { describe, expect, it } from 'vitest';

import { toMyBubbleState } from './my-bubble';

const base = {
  phase: 'USER_READY' as const,
  reviewing: false,
  typing: false,
  unsent: false,
  text: '',
};

describe('toMyBubbleState', () => {
  it('듣는 중이면 말하는 중 말풍선이다', () => {
    expect(toMyBubbleState({ ...base, phase: 'USER_SPEAKING' })).toBe(
      'speaking',
    );
  });

  it('말한 뒤 확인 중이면 확인 말풍선이다', () => {
    expect(
      toMyBubbleState({ ...base, phase: 'USER_SPEAKING', reviewing: true }),
    ).toBe('review');
  });

  it('보낸 뒤 대답을 기다리는 동안엔 보낸 말풍선이다', () => {
    expect(
      toMyBubbleState({ ...base, phase: 'AI_THINKING', text: 'Hello!' }),
    ).toBe('sent');
  });

  it('보내지 못했으면 실패 말풍선이다', () => {
    expect(toMyBubbleState({ ...base, unsent: true, text: 'Hello!' })).toBe(
      'failed',
    );
  });

  it('보내지 못한 답을 다시 보내는 동안엔 보낸 말풍선으로 돌아간다', () => {
    expect(
      toMyBubbleState({
        ...base,
        phase: 'AI_THINKING',
        unsent: true,
        text: 'Hello!',
      }),
    ).toBe('sent');
  });

  it('키보드로 쓰는 동안엔 입력창이 그 말을 들어 말풍선을 두지 않는다', () => {
    expect(
      toMyBubbleState({ ...base, phase: 'USER_SPEAKING', typing: true }),
    ).toBeNull();
  });

  it.each([
    ['내 차례를 기다리는 중', 'USER_READY'],
    ['상대가 말하는 중', 'AI_SPEAKING'],
    ['대화가 끝남', 'DONE'],
  ] as const)('%s이면 말풍선이 없다', (_, phase) => {
    expect(toMyBubbleState({ ...base, phase, text: 'Hello!' })).toBeNull();
  });

  it('보낼 글이 비어 있으면 대답을 기다려도 말풍선이 없다', () => {
    expect(toMyBubbleState({ ...base, phase: 'AI_THINKING' })).toBeNull();
  });
});
