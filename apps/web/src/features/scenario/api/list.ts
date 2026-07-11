// 시나리오 전체 조회 — 카테고리별 시나리오 목록과 잠금·완료·별점·시작 미리보기 (백엔드 ScenarioListResponse 미러)
import { api } from '@/shared/api/client';

export interface ScenarioListResponse {
  categories: ScenarioCategory[];
}

export interface ScenarioCategory {
  categoryId: number;
  categoryName: string;
  displayOrder: number;
  categoryLocked: boolean;
  categoryLockReason: string | null;
  scenarios: Scenario[];
}

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

export interface ScenarioOpeningPreview {
  aiOpeningMessage: string | null;
  aiOpeningMessageTranslation: string | null;
  userOpeningInstruction: string | null;
  innerThought: string | null;
  innerThoughtType: string | null;
  ttsVoiceSetId: string | null;
}

export const getScenarios = () =>
  api.get<ScenarioListResponse>('/api/v1/scenarios');
