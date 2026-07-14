// 대화 상태 기계 검증 — 발화→마이크→듣기→속마음→다음 턴 전이와 종료 판정
import { describe, expect, it } from 'vitest';

import {
  initialConversationState,
  nextConversationState,
  type ConversationState,
} from './conversationMachine';

const state = (
  phase: ConversationState['phase'],
  turnIndex = 0,
): ConversationState => ({ phase, turnIndex });

describe('initialConversationState', () => {
  it('AI가 먼저 말하면 AI 발화부터 시작한다', () => {
    expect(initialConversationState('AI')).toEqual(state('AI_SPEAKING'));
  });

  it('유저가 먼저 말하면 마이크 대기부터 시작한다', () => {
    expect(initialConversationState('USER')).toEqual(state('USER_IDLE'));
  });
});

describe('nextConversationState', () => {
  it('AI 발화가 끝나면 마이크 대기로 넘어간다', () => {
    expect(
      nextConversationState(state('AI_SPEAKING'), 'AI_SPEECH_END', 3),
    ).toEqual(state('USER_IDLE'));
  });

  it('마이크를 누르면 듣기가 시작된다', () => {
    expect(nextConversationState(state('USER_IDLE'), 'MIC_PRESSED', 3)).toEqual(
      state('USER_LISTENING'),
    );
  });

  it('듣는 중 중단(X)하면 마이크 대기로 되돌아간다', () => {
    expect(
      nextConversationState(state('USER_LISTENING'), 'LISTENING_CANCELLED', 3),
    ).toEqual(state('USER_IDLE'));
  });

  it('듣기를 완료(■)하면 속마음으로 넘어간다', () => {
    expect(
      nextConversationState(state('USER_LISTENING'), 'LISTENING_DONE', 3),
    ).toEqual(state('THOUGHT'));
  });

  it('속마음이 끝나면 다음 턴 AI 발화로 넘어간다', () => {
    expect(
      nextConversationState(state('THOUGHT', 0), 'THOUGHT_DONE', 3),
    ).toEqual(state('AI_SPEAKING', 1));
  });

  it('마지막 턴의 속마음이 끝나면 대화가 종료된다', () => {
    expect(
      nextConversationState(state('THOUGHT', 2), 'THOUGHT_DONE', 3),
    ).toEqual(state('DONE', 2));
  });

  it.each([
    {
      name: 'AI 발화 중 마이크 누름',
      from: state('AI_SPEAKING'),
      event: 'MIC_PRESSED',
    },
    {
      name: '마이크 대기 중 발화 종료',
      from: state('USER_IDLE'),
      event: 'AI_SPEECH_END',
    },
    {
      name: '종료 후 마이크 누름',
      from: state('DONE', 2),
      event: 'MIC_PRESSED',
    },
  ] as const)('$name — 단계와 무관한 이벤트는 무시한다', ({ from, event }) => {
    expect(nextConversationState(from, event, 3)).toEqual(from);
  });
});
