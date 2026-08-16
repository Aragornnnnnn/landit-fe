// 피드백 유형이 화면에 나오는 모든 모습 — 이름·이모지·주소 조각, 그리고 작성 화면의 말투
// 유형이 하나 늘면 여기만 고치면 선택·작성·보낸 편지 제목이 함께 따라온다
import type { FeedbackType } from '../api/letter';

interface FeedbackTypeFace {
  emoji: string;
  // 선택 화면의 줄 이름. 보낸 편지의 제목은 서버가 유형 이름으로 내려준다
  label: string;
  // 주소에 실리는 조각 — 대문자 enum을 그대로 노출하지 않는다
  slug: string;
  // 작성 화면에서 무엇을 물을지. 유형마다 묻는 방식이 달라야 답이 달라진다
  question: string;
  placeholder: string;
  // 다 쓴 뒤 눈이 닿는 자리 — 보내도 괜찮다는 말을 대신한다
  assurance: string;
}

export const FEEDBACK_TYPE_FACES: Record<FeedbackType, FeedbackTypeFace> = {
  BUG_REPORT: {
    emoji: '🐛',
    label: '문제 신고하기',
    slug: 'bug',
    question: '무슨 일이 있었는지\n편하게 알려주세요',
    placeholder: '내용을 자유롭게 적어주세요',
    assurance: '불편을 드려 죄송해요. 남겨주신 말씀, 하나하나 다 확인할게요.',
  },
  FEATURE_REQUEST: {
    emoji: '💡',
    label: '신규 기능 요청하기',
    slug: 'feature',
    question: '어떤 게 있으면\n더 편하게 쓰실 수 있을까요?',
    placeholder: '어떤 상황에서 필요했는지 적어주시면 더 좋아요',
    assurance: '좋은 의견, 하나하나 다 확인할게요.',
  },
  QUESTION: {
    emoji: '🙋',
    label: '궁금한 점 문의하기',
    slug: 'question',
    question: '무엇이든 편하게 물어보세요',
    placeholder: '궁금한 내용을 편하게 적어주세요',
    assurance: '궁금한 점, 빠짐없이 확인하고 답해드릴게요.',
  },
  CHEER: {
    emoji: '🙌',
    label: '개발자 응원하기',
    slug: 'cheer',
    question: '랜딧 팀에게\n따뜻한 한마디를 남겨주세요',
    placeholder: '힘이 되는 한마디를 자유롭게 적어주세요',
    assurance: '여러분의 응원 한 마디가 저희의 원동력이 돼요🥹',
  },
};

// 선택 화면이 그리는 순서 — 급한 것부터
export const FEEDBACK_TYPES = [
  'BUG_REPORT',
  'FEATURE_REQUEST',
  'QUESTION',
  'CHEER',
] as const satisfies readonly FeedbackType[];

// 주소 조각을 유형으로 되돌린다. 모르는 조각이면 유형이 없는 것으로 본다 —
// 손으로 고친 주소가 그대로 작성 화면을 열면 무엇을 묻는지 없는 화면이 된다
export const readFeedbackType = (slug: string): FeedbackType | null =>
  FEEDBACK_TYPES.find((type) => FEEDBACK_TYPE_FACES[type].slug === slug) ??
  null;
