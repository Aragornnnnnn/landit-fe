// 수준 평가 대기 판정 — 실패는 다시 받는 중이면 아직 기다리는 것으로 본다
import { describe, expect, it } from 'vitest';

import { resolveOutcome } from './useLevelAssessmentQuery';

describe('resolveOutcome', () => {
  it('실패로 남은 캐시를 다시 받는 중이면 아직 기다린다 — 총평에서 실패한 조회가 레벨 분석을 바로 건너뛰게 하지 않는다', () => {
    expect(resolveOutcome(undefined, { failed: true, fetching: true })).toBe(
      'pending',
    );
  });

  it('다시 받지도 않는 실패면 결과 없이 진행한다', () => {
    expect(resolveOutcome(undefined, { failed: true, fetching: false })).toBe(
      'unavailable',
    );
  });

  it('BE가 실패라고 답하면 결과 없이 진행한다', () => {
    expect(resolveOutcome('FAILED', { failed: false, fetching: false })).toBe(
      'unavailable',
    );
  });

  it('받아 둔 결과가 끝났으면 뒤이은 재조회가 실패해도 결과가 도착한 것이다 — 보던 점수 카드가 앱 복귀 재조회 실패로 사라지지 않게', () => {
    expect(resolveOutcome('COMPLETED', { failed: true, fetching: false })).toBe(
      'ready',
    );
  });

  it('끝났으면 결과가 도착한 것이다', () => {
    expect(
      resolveOutcome('COMPLETED', { failed: false, fetching: false }),
    ).toBe('ready');
  });
});
