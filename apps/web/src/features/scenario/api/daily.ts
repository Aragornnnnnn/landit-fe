// 날짜별 시나리오 조회 — 오늘 배정분 또는 그 날 최초 완료한 시나리오 하나 (백엔드 DailyScenarioResponse 미러)
import { api } from '@/shared/api/client';

import type { ScenarioOpeningPreview } from './list';

// NEW = 처음 받는 시나리오, RETRY = 전날 시작했다 못 끝내 다시 받는 것, CLEARED = 그 날 최초 완료한 것
export type DailyScenarioType = 'NEW' | 'RETRY' | 'CLEARED';

export interface DailyScenarioResponse {
  date: string; // yyyy-MM-dd
  // 서버가 시작·복습 가능 여부를 직접 판정해 준다 — 프론트가 상태 조합으로 유추하지 않는다
  playable: boolean;
  // 놓친 날처럼 조회 결과가 없으면 null
  scenario: DailyScenario | null;
}

export interface DailyScenario {
  scenarioId: number;
  scenarioTitle: string;
  briefing: string;
  conversationGoal: string;
  thumbnailUrl: string | null;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  firstSpeaker: 'AI' | 'USER';
  dailyScenarioType: DailyScenarioType;
  openingPreview: ScenarioOpeningPreview | null;
  completed: boolean;
  completedAt: string | null; // OffsetDateTime
  starRating: number | null;
  expressionCount: number;
  completedExpressionCount: number;
}

// date를 생략하면 서버가 Asia/Seoul 기준 오늘 것을 돌려준다 —
// 기기에서 오늘을 계산하면 자정 경계가 서버와 어긋난다
export const getDailyScenario = () =>
  api.get<DailyScenarioResponse>('/api/v1/scenarios/daily');
