import { describe, expect, it } from 'vitest';

import {
  toCharacterLook,
  toPartner,
  toThoughtExpression,
} from './character-look';
import type { FloatingThought, ThoughtType } from './thought';

const thoughtOf = (type: ThoughtType): FloatingThought => ({
  text: '속마음',
  type,
});

describe('toCharacterLook', () => {
  it('AI가 발화 중이면 말하는 자세가 된다', () => {
    // given — AI가 질문을 읽어주는 단계
    const phase = 'AI_SPEAKING' as const;

    // when
    const { posture } = toCharacterLook(phase, null);

    // then
    expect(posture).toBe('speaking');
  });

  it('유저가 아직 말하기 전이면 끄덕이지 않고 기다린다', () => {
    // given — 침묵에 맞장구치면 재촉으로 읽힌다. 끄덕임은 듣는 자세에서만 돈다
    // when
    const { posture } = toCharacterLook('USER_READY', null);

    // then
    expect(posture).toBe('idle');
  });

  it('유저가 말하는 중이면 듣는 자세가 된다', () => {
    // given / when
    const { posture } = toCharacterLook('USER_SPEAKING', null);

    // then
    expect(posture).toBe('listening');
  });

  it('제출한 뒤 속마음 오버레이가 덮는 동안은 멈춰 선다', () => {
    // given — 이미 다 들었고 화면도 가려져 있어 끄덕일 이유가 없다
    // when / then
    expect(toCharacterLook('AI_THINKING', null)).toEqual({
      posture: 'idle',
      expression: 'neutral',
    });
    expect(toCharacterLook('AI_INNER_THOUGHT', null)).toEqual({
      posture: 'idle',
      expression: 'neutral',
    });
  });

  it('대화가 끝나면 기본 자세로 선다', () => {
    // given / when
    const { posture } = toCharacterLook('DONE', null);

    // then
    expect(posture).toBe('idle');
  });

  it('노출을 끝낸 속마음이 있으면 그 감정이 표정으로 얹힌다', () => {
    // given / when / then
    expect(toCharacterLook('AI_SPEAKING', thoughtOf('GOOD')).expression).toBe(
      'happy',
    );
    expect(toCharacterLook('AI_SPEAKING', thoughtOf('BAD')).expression).toBe(
      'frown',
    );
  });

  it('표정이 얹혀도 자세는 그대로 유지된다', () => {
    // given — 한 축으로 합쳐두면 표정이 뜨는 1초 동안 말하는 자세가 사라져서,
    // 입 흉내가 멈추고 찡그린 입이 립싱크를 가린다
    // when
    const look = toCharacterLook('AI_SPEAKING', thoughtOf('BAD'));

    // then
    expect(look).toEqual({ posture: 'speaking', expression: 'frown' });
  });
});

describe('toThoughtExpression', () => {
  it('긍정 속마음이면 기뻐한다', () => {
    // given / when / then
    expect(toThoughtExpression('GOOD')).toBe('happy');
  });

  it('부정 속마음이면 찡그린다', () => {
    // given / when / then
    expect(toThoughtExpression('BAD')).toBe('frown');
  });

  it('중립 속마음이면 표정을 얹지 않는다', () => {
    // given — 하던 자세를 그대로 이어가야 한다
    // when / then
    expect(toThoughtExpression('NORMAL')).toBe('neutral');
  });
});

describe('toPartner', () => {
  const voiceOf = (model: string, gender: 'MALE' | 'FEMALE') => ({
    model,
    gender,
  });

  it('테디 전용 모델이면 성별과 무관하게 테디다', () => {
    // given — 백엔드는 캐릭터 필드 없이 TTS 모델로 캐스팅한다 (landit-be V38)
    // when
    const partner = toPartner(voiceOf('deepgram/aura-2', 'MALE'));

    // then
    expect(partner).toBe('teddy');
  });

  it('캐스팅 목록에 없는 모델은 성별로 폴백한다', () => {
    // given / when / then
    expect(toPartner(voiceOf('microsoft/mai-voice-2', 'MALE'))).toBe('marco');
    expect(toPartner(voiceOf('microsoft/mai-voice-2', 'FEMALE'))).toBe('chloe');
  });

  it('음성이 없으면 마르코다', () => {
    // given — 음성 미설정 시나리오도 대화는 계속된다
    // when / then
    expect(toPartner(null)).toBe('marco');
  });
});
