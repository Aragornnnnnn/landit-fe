// 기존 유저에게 아직 안 물어본 프로필 질문을 골라내는 계약 검증
import { describe, expect, it } from 'vitest';

import { collectPendingQuestions } from './profile-gate';

describe('collectPendingQuestions', () => {
  it('둘 다 없으면 온보딩과 같은 순서(수준 → 나라)로 돌려준다', () => {
    expect(
      collectPendingQuestions({ learningLevel: null, accentLocale: null }),
    ).toEqual(['level', 'accent']);
  });

  it('수준만 있으면 나라만 남는다', () => {
    expect(
      collectPendingQuestions({ learningLevel: 3, accentLocale: null }),
    ).toEqual(['accent']);
  });

  it('나라만 있으면 수준만 남는다', () => {
    expect(
      collectPendingQuestions({ learningLevel: null, accentLocale: 'EN_GB' }),
    ).toEqual(['level']);
  });

  it('둘 다 있으면 물을 게 없다', () => {
    expect(
      collectPendingQuestions({ learningLevel: 3, accentLocale: 'EN_GB' }),
    ).toEqual([]);
  });

  it('아직 모르는 질문은 묻지 않는다 — 이미 답한 사람에게 또 묻는 게 더 나쁘다', () => {
    expect(collectPendingQuestions({})).toEqual([]);
  });

  it('한쪽만 알아도 아는 쪽은 묻는다 — 나머지 조회가 실패했다고 같이 포기하지 않는다', () => {
    expect(collectPendingQuestions({ learningLevel: null })).toEqual(['level']);
    expect(collectPendingQuestions({ accentLocale: null })).toEqual(['accent']);
  });
});
