// 피드백 표시용 순수 함수 — 평가 맥락 라벨, 총평 헤드라인, CTA 문구 (별점은 shared/ui/StarRating 재사용)
import type { EvaluationContextType } from '../api/session-feedback';

// 상세 카드 상단이 AI 질문인지, 유저가 먼저 말하는 시나리오 지시문인지 구분한다.
export const evaluationContextLabel = (type: EvaluationContextType): string =>
  type === 'AI_MESSAGE' ? '질문' : '상황';

// 총평 헤드라인 — 서버가 시나리오×별점마다 정해 둔 문구(landit-be#229). 비어 오면 BE가 문구를 못 찾았을 때 쓰는 기본 문구로 대신한다
const FALLBACK_HEADLINE = '오늘도 시나리오를 잘 마무리했어요';
export const summaryHeadline = (highlightMessage: string): string =>
  highlightMessage.trim() || FALLBACK_HEADLINE;

// 남은 개선 턴 수에 따라 상세로 넘어가는 CTA 문구를 고른다.
export const detailCtaLabel = (improvementCount: number): string =>
  improvementCount > 0
    ? `원어민까지 ${improvementCount}걸음, 고쳐볼게요`
    : '뭐가 잘 통했는지 볼게요';

// 서버가 상세를 잠근 세션의 CTA — 턴 수를 모르니 걸음 수를 셀 수 없고, 누르면 페이월로 간다.
// TODO: 제품 확정 카피로 교체.
export const LOCKED_DETAIL_CTA_LABEL = '상세 피드백 볼게요';
