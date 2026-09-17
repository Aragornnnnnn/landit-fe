'use client';

// 피드백 헤더에 쓸 제목 — 그 날 카드에서 찾고, 카드가 이 시나리오가 아니면 기본 문구를 쓴다
import type { DailyScenario } from '@/features/scenario/api/daily';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';

// 그 날 카드가 이 시나리오가 아닐 때 쓰는 제목 — 자정을 넘겨 끝낸 대화가 여기 걸린다.
// 대화 화면과 달리 막지 않는다. 피드백은 세션 것이라 카드가 안 맞아도 보여줄 수 있다
export const FALLBACK_TITLE = '대화 피드백';

/** 그 날 카드에서 이 시나리오의 제목을 고른다. 카드가 없거나 다른 시나리오면 기본 문구 */
export const resolveFeedbackTitle = (
  card: DailyScenario | null | undefined,
  scenarioId: number,
) =>
  card && card.scenarioId === scenarioId ? card.scenarioTitle : FALLBACK_TITLE;

/**
 * 피드백 헤더 제목을 읽는다 — 대화 화면이 같은 키로 받아 둔 캐시라 보통 즉시 있다.
 * 없어도 기다리지 않는다. 제목 하나 때문에 피드백을 막을 이유가 없고, 오면 그때 갈아끼운다
 */
export const useFeedbackTitle = (scenarioId: number, date?: string) => {
  const { daily } = useDailyScenarioQuery(date);
  return resolveFeedbackTitle(daily?.scenario, scenarioId);
};
