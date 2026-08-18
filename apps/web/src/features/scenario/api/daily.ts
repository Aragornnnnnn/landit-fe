// 날짜별 시나리오 조회 — 오늘 배정분 또는 그 날 최초 완료한 시나리오 하나 (백엔드 DailyScenarioResponse 미러)
import type { Partner } from '@/features/conversation/model/character-look';
import { api } from '@/shared/api/client';
import type { TtsVoice } from '@/shared/tts/voice';

export interface ScenarioOpeningPreview {
  aiOpeningMessage: string | null;
  aiOpeningMessageTranslation: string | null;
  userOpeningInstruction: string | null;
  innerThought: string | null;
  innerThoughtType: string | null;
  ttsVoice: TtsVoice | null; // 활성 시나리오 TTS 음성 (세션 시작 ttsVoice와 동일 구조)
  // 이 시나리오의 상대. 얼굴은 이 값으로 정한다 — 세션 시작 응답에도 같은 값이 오지만 그건 백그라운드라 늦다
  characterId: Partner | null;
}

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

// date를 생략하면 서버가 오늘 것을 돌려준다 — 기기에서 오늘을 계산하지 않아야 자정 경계가 어긋나지 않는다.
// 날짜를 줄 때는 Asia/Seoul 기준 yyyy-MM-dd. 미래 날짜는 서버가 400으로 막는다
export const getDailyScenario = (date?: string) =>
  api.get<DailyScenarioResponse>(
    date
      ? `/api/v1/scenarios/daily?date=${encodeURIComponent(date)}`
      : '/api/v1/scenarios/daily',
  );
