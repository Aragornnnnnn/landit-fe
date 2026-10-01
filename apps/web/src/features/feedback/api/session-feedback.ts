// 세션 피드백 생성·조회 — 총평과 턴별 상세 (백엔드 SessionFeedbackResponse 미러)
import { api } from '@/shared/api/client';

import type { SessionLevelAssessmentResponse } from './level-assessment';

export interface SessionFeedbackResponse {
  sessionId: number;
  nativeScore: number;
  starRating: number;
  // 시나리오×별점마다 정해 둔 문구 (landit-be#229부터, 없으면 BE 기본 문구)
  highlightMessage: string;
  summaryMessage: string;
  // 상세 피드백(메시지별). 잠긴 세션이면 빈 배열
  messageFeedbacks: MessageFeedbackResponse[];
  // 무료 사용자에게 상세 피드백이 잠겼는가 — 첫 시나리오의 첫 완료 세션만 열린다. 결제 뒤 다시 부르면 false와 함께 전부 온다.
  // BE landit-be#192부터 온다. 없는 구버전 응답은 열린 것으로 본다 (그 BE는 대화 자체를 하나로 막는다)
  detailFeedbackLocked?: boolean;
  // 아래 셋은 landit-be#228부터 온다
  // 수준 평가 상태와 결과. 평가 비활성 세션이면 null
  userLevelAssessment?: SessionLevelAssessmentResponse | null;
  // 직전 완료 시나리오의 실수 비교. 비교할 근거가 없으면 null(빈 문구를 띄운다), 필드가 없는(undefined) 구버전 응답은 카드를 그리지 않는다 — 둘을 합치지 않는다
  growthFeedback?: ScenarioGrowthCard | null;
  // 배운 표현 재사용. 결과가 없으면 items가 빈 배열
  expressionReuse?: ScenarioExpressionReuseSummary | null;
}

export interface ScenarioGrowthCard {
  // 실수 패턴 코드(PAST_TENSE, ARTICLE, …). 화면엔 patternLabel만 쓴다
  pattern: string;
  // 화면용 한국어 이름 (과거형)
  patternLabel: string;
  // true = 이번엔 맞음(성공), false = 이번에도 틀림(반복)
  succeeded: boolean;
  previousDate: string;
  previousSentence: string;
  // 스웨거상 nullable 미선언이나, 스몰톡 같은 카드처럼 구절을 특정하지 못하면 비어 올 수 있어 null 허용으로 둔다
  previousWrongSpan: string | null;
  currentSentence: string;
  currentSpan: string | null;
}

export interface ScenarioExpressionReuseSummary {
  // 분석 중이면 true
  pending: boolean;
  items: ScenarioExpressionReuseItem[];
}

export interface ScenarioExpressionReuseItem {
  expressionId: number;
  // 학습 표현 원문(칩)
  text: string;
  meaning: string;
  // 학습 날짜와 출처 기능
  sourceLabel: string;
  messageId: number;
  // 표현을 쓴 사용자 문장
  quotedSentence: string;
  // 문장에서 강조할 구절
  matchedText: string;
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
