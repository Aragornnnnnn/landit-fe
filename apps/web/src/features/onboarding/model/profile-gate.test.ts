// 기존 유저에게 아직 안 물어본 프로필 질문을 골라내는 계약 검증 — 지금은 배울 영어(억양) 하나뿐이다
import { describe, expect, it } from 'vitest';

import { collectPendingQuestions } from './profile-gate';

describe('collectPendingQuestions', () => {
  it('나라가 없으면 나라를 묻는다', () => {
    expect(collectPendingQuestions({ accentLocale: null })).toEqual(['accent']);
  });

  it('나라가 있으면 물을 게 없다', () => {
    expect(collectPendingQuestions({ accentLocale: 'EN_GB' })).toEqual([]);
  });

  it('아직 모르면 묻지 않는다 — 이미 답한 사람에게 또 묻는 게 더 나쁘다', () => {
    expect(collectPendingQuestions({})).toEqual([]);
  });

  it('영어 수준은 묻지 않는다 — 첫 대화로 서버가 매긴다', () => {
    expect(collectPendingQuestions({ accentLocale: null })).not.toContain(
      'level',
    );
  });
});
