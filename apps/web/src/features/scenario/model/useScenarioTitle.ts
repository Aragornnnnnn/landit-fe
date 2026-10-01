'use client';

// 화면 헤더에 쓸 시나리오 제목 — 그 날 카드에서 찾고, 카드가 이 시나리오가 아니면 화면이 준 대체 문구를 쓴다. 대화 직후 피드백과 시나리오 기록이 같이 쓴다
import type { DailyScenario } from '../api/daily';
import { useDailyScenarioQuery } from './useDailyScenarioQuery';

/**
 * 그 날 카드에서 이 시나리오의 제목을 고른다. 카드가 없거나 다른 시나리오면 대체 문구 —
 * 자정을 넘겨 끝낸 대화가 여기 걸린다. 회차는 세션 것이라 카드가 안 맞아도 화면을 막지 않는다
 */
export const resolveScenarioTitle = (
  card: DailyScenario | null | undefined,
  scenarioId: number,
  fallback: string,
) => (card && card.scenarioId === scenarioId ? card.scenarioTitle : fallback);

/**
 * 헤더 제목을 읽는다 — 카드 화면이 같은 키로 받아 둔 캐시라 보통 즉시 있다.
 * 없어도 기다리지 않는다. 제목 하나 때문에 화면을 막을 이유가 없고, 오면 그때 갈아끼운다
 */
export const useScenarioTitle = (
  scenarioId: number,
  date: string | undefined,
  fallback: string,
) => {
  const { daily } = useDailyScenarioQuery(date);
  return resolveScenarioTitle(daily?.scenario, scenarioId, fallback);
};
