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
      nextConversationState(state('AI_SPEAKING'), 'AI_SPEECH_END', true),
    ).toEqual(state('USER_IDLE'));
  });

  it('마이크를 누르면 듣기가 시작된다', () => {
    expect(
      nextConversationState(state('USER_IDLE'), 'MIC_PRESSED', true),
    ).toEqual(state('USER_LISTENING'));
  });

  it('듣는 중 중단(X)하면 마이크 대기로 되돌아간다', () => {
    expect(
      nextConversationState(
        state('USER_LISTENING'),
        'LISTENING_CANCELLED',
        true,
      ),
    ).toEqual(state('USER_IDLE'));
  });

  it('듣기를 완료(■)하면 응답 대기로 넘어간다', () => {
    expect(
      nextConversationState(state('USER_LISTENING'), 'LISTENING_DONE', true),
    ).toEqual(state('WAITING'));
  });

  it('대기 중 응답이 오면 속마음으로 넘어간다', () => {
    expect(
      nextConversationState(state('WAITING'), 'RESPONSE_READY', true),
    ).toEqual(state('THOUGHT'));
  });

  it('대기 중 속마음을 건너뛰면(빈값) 바로 다음 AI 발화로 넘어간다', () => {
    expect(
      nextConversationState(state('WAITING', 0), 'RESPONSE_SKIPPED', true),
    ).toEqual(state('AI_SPEAKING', 1));
  });

  it('대기 중 속마음을 건너뛰는데 다음 턴이 없으면 대화가 종료된다', () => {
    expect(
      nextConversationState(state('WAITING', 2), 'RESPONSE_SKIPPED', false),
    ).toEqual(state('DONE', 2));
  });

  it('대기 중 제출이 실패하면 마이크 대기로 되돌아간다', () => {
    expect(
      nextConversationState(state('WAITING'), 'RESPONSE_FAILED', true),
    ).toEqual(state('USER_IDLE'));
  });

  it('다음 턴이 남아있으면 속마음이 끝난 뒤 다음 AI 발화로 넘어간다', () => {
    expect(
      nextConversationState(state('THOUGHT', 0), 'THOUGHT_DONE', true),
    ).toEqual(state('AI_SPEAKING', 1));
  });

  it('다음 턴이 없으면 속마음이 끝난 뒤 대화가 종료된다', () => {
    expect(
      nextConversationState(state('THOUGHT', 2), 'THOUGHT_DONE', false),
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
    expect(nextConversationState(from, event, true)).toEqual(from);
  });
});
