// 날짜별 시나리오 응답을 기존 카드가 아는 모양으로 맞춘다 — API 레이어는 백엔드를 그대로 미러하고 가공은 여기서 한다
import type { DailyScenario, ScenarioOpeningPreview } from '../api/daily';

// 카드·대화 화면이 아는 시나리오 모양. 목록 API가 내려주던 형태를 이어받았고,
// 지금은 날짜별 응답을 이 모양으로 맞춰서 쓴다
export interface Scenario {
  scenarioId: number;
  starRating: number | null;
  displayOrder: number;
  scenarioTitle: string;
  briefing: string;
  conversationGoal: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  firstSpeaker: 'AI' | 'USER';
  thumbnailUrl: string | null;
  completed: boolean;
  locked: boolean;
  lockReason: string | null;
  openingPreview: ScenarioOpeningPreview | null;
}

// 카드 앞면·뒷면은 이미 Scenario로 만들어져 있다. 날짜별 응답에는 목록 전용 필드(displayOrder·lockReason)가
// 없으므로 그 자리를 채워 넘긴다. 잠금은 서버가 판정한 playable을 그대로 따른다
export const toScenario = (
  daily: DailyScenario,
  playable: boolean,
): Scenario => ({
  scenarioId: daily.scenarioId,
  starRating: daily.starRating,
  // 하루에 한 장이라 순서라는 개념이 없다
  displayOrder: 0,
  scenarioTitle: daily.scenarioTitle,
  briefing: daily.briefing,
  conversationGoal: daily.conversationGoal,
  difficulty: daily.difficulty,
  firstSpeaker: daily.firstSpeaker,
  thumbnailUrl: daily.thumbnailUrl,
  completed: daily.completed,
  locked: !playable,
  lockReason: null,
  openingPreview: daily.openingPreview,
});
