'use client';

// 화면 헤더에 쓸 시나리오 제목 — 그 날 카드에서 찾고, 카드가 이 시나리오가 아니면 화면이 준 대체 문구를 쓴다
import type { DailyScenario } from '../api/daily';
import { useDailyScenarioQuery } from './useDailyScenarioQuery';

// 카드가 없거나 다른 시나리오(자정을 넘겨 끝낸 대화)면 대체 문구
export const resolveScenarioTitle = (
  card: DailyScenario | null | undefined,
  scenarioId: number,
  fallback: string,
) => (card && card.scenarioId === scenarioId ? card.scenarioTitle : fallback);

// 카드 화면이 받아 둔 캐시라 보통 즉시 있다 — 없어도 기다리지 않고, 오면 갈아끼운다
export const useScenarioTitle = (
  scenarioId: number,
  date: string | undefined,
  fallback: string,
) => {
  const { daily } = useDailyScenarioQuery(date);
  return resolveScenarioTitle(daily?.scenario, scenarioId, fallback);
};
