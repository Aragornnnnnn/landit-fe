// 시나리오 기록 조회 — 그 시나리오를 완료한 회차 전부와 회차마다 저장된 대화·피드백 (백엔드 ScenarioHistoryResponse 미러)
import type { ProcessingStatus } from '@/features/conversation/api/session';
import type { SessionFeedbackResponse } from '@/features/feedback/api/session-feedback';
import { api } from '@/shared/api/client';

export interface ScenarioHistoryResponse {
  scenarioId: number;
  // 완료 회차를 endedAt 내림차순(동률이면 sessionId 내림차순)으로. 기록이 없거나 없는 시나리오면 빈 배열
  sessions: ScenarioHistorySession[];
}

export interface ScenarioHistorySession {
  sessionId: number;
  // 시간대 없는 LocalDateTime(2026-09-29T21:03:11)
  startedAt: string;
  endedAt: string;
  // messageSequence 오름차순
  messages: ScenarioHistoryMessage[];
  // 저장된 완료 피드백. 아직 없으면 null이고, 조회가 새로 만들지 않는다. 읽기 전용이라 userLevelAssessment는 늘 null
  feedback: SessionFeedbackResponse | null;
}

export interface ScenarioHistoryMessage {
  messageId: number;
  messageSequence: number;
  turnNumber: number;
  role: 'AI' | 'USER';
  content: string;
  translatedContent: string | null;
  innerThought: string | null;
  innerThoughtType: string | null;
  // 속마음 대상이 아니면 null
  innerThoughtProcessingStatus: ProcessingStatus | null;
}

export const getScenarioHistory = (scenarioId: number) =>
  api.get<ScenarioHistoryResponse>(`/api/v1/scenarios/${scenarioId}/history`);
