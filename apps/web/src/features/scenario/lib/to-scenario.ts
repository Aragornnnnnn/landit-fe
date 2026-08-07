// 날짜별 시나리오 응답을 기존 카드가 아는 모양으로 맞춘다 — API 레이어는 백엔드를 그대로 미러하고 가공은 여기서 한다
import type { DailyScenario, ScenarioOpeningPreview } from '../api/daily';

// 카드·대화 화면이 아는 시나리오 모양. 목록 API가 내려주던 형태를 이어받았고,
// 지금은 날짜별 응답을 이 모양으로 맞춰서 쓴다
export interface Scenario {
  scenarioId: number;
  starRating: number | null;
  scenarioTitle: string;
  briefing: string;
  conversationGoal: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  firstSpeaker: 'AI' | 'USER';
  thumbnailUrl: string | null;
  completed: boolean;
  locked: boolean;
  openingPreview: ScenarioOpeningPreview | null;
}

// 카드가 아는 어휘를 좁게 유지한다 — dailyScenarioType·expressionCount 같은 조회 전용 필드는
// 넘기지 않는다. 잠금은 상태 조합으로 유추하지 않고 서버가 판정한 playable을 그대로 따른다
export const toScenario = (
  daily: DailyScenario,
  playable: boolean,
): Scenario => ({
  scenarioId: daily.scenarioId,
  starRating: daily.starRating,
  scenarioTitle: daily.scenarioTitle,
  briefing: daily.briefing,
  conversationGoal: daily.conversationGoal,
  difficulty: daily.difficulty,
  firstSpeaker: daily.firstSpeaker,
  thumbnailUrl: daily.thumbnailUrl,
  completed: daily.completed,
  locked: !playable,
  openingPreview: daily.openingPreview,
});
