// 피드백 표시용 순수 함수 — 평가 맥락 라벨 키, 총평 헤드라인, 잠긴 옛 응답 판정 (문구는 feedback 묶음, 별점은 shared/ui/StarRating 재사용)
import type { EvaluationContextType } from '../api/session-feedback';

// 상세 카드 상단이 AI 질문인지, 유저가 먼저 말하는 시나리오 지시문인지 구분한다 (feedback.feedbackDetail의 키)
export const evaluationContextLabelKey = (type: EvaluationContextType) =>
  type === 'AI_MESSAGE'
    ? ('questionLabel' as const)
    : ('situationLabel' as const);

// 총평 헤드라인 — 서버가 시나리오×별점마다 정해 둔 문구(landit-be#229). 비어 오면 null이고 화면이 기본 문구로 대신한다
export const summaryHeadline = (highlightMessage: string): string | null =>
  highlightMessage.trim() || null;

// 유료인데 잠긴 응답을 들고 있다 — 무료일 때 받아 둔 옛 응답이라 한 번 다시 받아야 한다
export const isStaleLockedFeedback = (
  premium: boolean | undefined,
  feedback: { detailFeedbackLocked?: boolean } | null | undefined,
) => premium === true && feedback?.detailFeedbackLocked === true;
