// 세션 피드백 생성·조회 — 총평과 턴별 상세 (백엔드 SessionFeedbackResponse 미러)
import { api } from '@/shared/api/client';

export interface SessionFeedbackResponse {
  sessionId: number;
  nativeScore: number;
  starRating: number;
  highlightMessage: string;
  summaryMessage: string;
  // 상세 피드백(메시지별). 잠긴 세션이면 빈 배열
  messageFeedbacks: MessageFeedbackResponse[];
  // 무료 사용자에게 상세 피드백이 잠겼는가 — 첫 시나리오의 첫 완료 세션만 열린다. 결제 뒤 다시 부르면 false와 함께 전부 온다.
  // BE landit-be#192부터 온다. 없는 구버전 응답은 열린 것으로 본다 (그 BE는 대화 자체를 하나로 막는다)
  detailFeedbackLocked?: boolean;
}

export interface MessageFeedbackResponse {
  messageFeedbackId: number;
  messageId: number;
  turnNumber: number;
  userMessage: string;
  evaluationContext: EvaluationContextResponse;
  feedbackType: FeedbackType;
  // 아래 상세 필드는 스웨거상 nullable 미선언이나, GOOD/개선 타입에 따라
  // 한쪽만 채워져 오는 게 실제 동작이라 null 허용으로 둔다.
  baseLocaleAnalogy: string | null;
  positiveFeedback: string | null;
  feedbackDetail: string | null;
  correctionExpression: string | null;
  correctionReason: string | null;
  benchmarkMessage: string | null;
}

export interface EvaluationContextResponse {
  type: EvaluationContextType;
  content: string;
  translatedContent: string;
}

export type FeedbackType = 'GOOD' | 'NEEDS_IMPROVEMENT';

export type EvaluationContextType =
  'AI_MESSAGE' | 'SCENARIO_OPENING_INSTRUCTION';

export const createSessionFeedback = (sessionId: number) =>
  api.post<SessionFeedbackResponse>(`/api/v1/sessions/${sessionId}/feedback`);
