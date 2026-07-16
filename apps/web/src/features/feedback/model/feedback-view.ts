// 피드백 표시용 순수 함수 — 평가 맥락 라벨, 점수대별 총평 헤드라인, CTA 문구 (별점은 shared/ui/StarRating 재사용)
import type { EvaluationContextType } from '../api/session-feedback';

// 상세 카드 상단이 AI 질문인지, 유저가 먼저 말하는 시나리오 지시문인지 구분한다.
export const evaluationContextLabel = (type: EvaluationContextType): string =>
  type === 'AI_MESSAGE' ? '질문' : '상황';

// 총평 헤드라인 — 점수대별 하드코딩 문구. (전달력 본문은 API summaryMessage에서 온다)
// TODO: 제품 확정 카피로 교체.
export const scoreHeadline = (score: number): string => {
  if (score >= 90) return '완벽하게 원어민 옆에 착지했어요';
  if (score >= 80) return '거의 원어민처럼 착지했어요';
  if (score >= 70) return '원어민 근처에 사뿐히 착지했어요';
  if (score >= 60) return '살짝 빗나갔지만 잘 착지했어요';
  if (score >= 40) return '착지가 조금 흔들렸어요';
  return '아직 착지까지 연습이 필요해요';
};

// 남은 개선 턴 수에 따라 상세로 넘어가는 CTA 문구를 고른다.
export const detailCtaLabel = (improvementCount: number): string =>
  improvementCount > 0
    ? `원어민까지 ${improvementCount}걸음, 고쳐볼게요`
    : '뭐가 잘 통했는지 볼게요';
