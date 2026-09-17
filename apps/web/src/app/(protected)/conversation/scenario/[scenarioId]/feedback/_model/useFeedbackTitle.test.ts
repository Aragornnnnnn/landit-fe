// 피드백 헤더 제목 고르기 — 그 날 카드가 이 시나리오일 때만 카드 제목을 쓴다
import { describe, expect, it } from 'vitest';

import type { DailyScenario } from '@/features/scenario/api/daily';

import { FALLBACK_TITLE, resolveFeedbackTitle } from './useFeedbackTitle';

const card = (scenarioId: number) =>
  ({ scenarioId, scenarioTitle: '카페에서 주문하기' }) as DailyScenario;

describe('resolveFeedbackTitle', () => {
  it('그 날 카드가 이 시나리오면 카드 제목을 쓴다', () => {
    expect(resolveFeedbackTitle(card(7), 7)).toBe('카페에서 주문하기');
  });

  it('카드가 다른 시나리오면 기본 문구를 쓴다 — 자정을 넘겨 끝낸 대화가 여기 걸린다', () => {
    // Given 23:58에 시작해 00:01에 끝낸 대화라 날짜 없는 조회가 다음 날 카드를 줬을 때
    // When 제목을 고르면
    // Then 남의 카드 제목을 달지 않는다
    expect(resolveFeedbackTitle(card(8), 7)).toBe(FALLBACK_TITLE);
  });

  it('카드가 아직 없으면 기본 문구를 쓴다 — 제목을 기다리지 않는다', () => {
    expect(resolveFeedbackTitle(null, 7)).toBe(FALLBACK_TITLE);
    expect(resolveFeedbackTitle(undefined, 7)).toBe(FALLBACK_TITLE);
  });
});
