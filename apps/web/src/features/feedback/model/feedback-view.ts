// 피드백 표시용 순수 함수 — 평가 맥락 라벨, 점수대별 전달력 문구, CTA 문구 (별점은 shared/ui/StarRating 재사용)
import type { EvaluationContextType } from '../api/session-feedback';

// 상세 카드 상단이 AI 질문인지, 유저가 먼저 말하는 시나리오 지시문인지 구분한다.
export const evaluationContextLabel = (type: EvaluationContextType): string =>
  type === 'AI_MESSAGE' ? '질문' : '상황';

// 원어민 이해도 점수를 전달력 한 줄 평으로 옮긴다 (총평 "전달력" 칸).
export const deliveryInterpretation = (score: number): string => {
  if (score >= 95) return '어색한 표현 하나 없이, 원어민이 완벽히 이해했어요.';
  if (score >= 90) return '원어민과 프리토킹이 가능해요.';
  if (score >= 80)
    return '원어민이 되묻지 않고 한 번에 알아들었어요. 사소한 실수 정도는 인간미라 괜찮아요.';
  if (score >= 70)
    return '살짝 어색한 표현이 있어도, 원어민이 내 의도를 알아듣는 데엔 문제 없어요.';
  if (score >= 60)
    return '유창하진 않아도 괜찮아요. 하고 싶은 말은 다 전달됐어요.';
  if (score >= 50)
    return '원어민이 아리송해하면서도 어느 정도 알아들었어요. 조금만 다듬으면 또렷하게 전달돼요.';
  if (score >= 40)
    return '센스 있는 원어민은 핵심을 알아차렸지만, 무심한 상대였다면 놓쳤을 거예요.';
  if (score >= 30) return '원어민이 무슨 말인지 감 정도만 잡았어요.';
  return '몸짓까지 썼다면 통했겠지만, 말만으로는 아직 어려웠어요.';
};

// 남은 개선 턴 수에 따라 상세로 넘어가는 CTA 문구를 고른다.
export const detailCtaLabel = (improvementCount: number): string =>
  improvementCount > 0
    ? `원어민까지 ${improvementCount}걸음, 고쳐볼게요`
    : '뭐가 잘 통했는지 볼게요';
