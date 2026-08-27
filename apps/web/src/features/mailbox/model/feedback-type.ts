// 피드백 유형이 화면에 나오는 모든 모습 — 이름·이모지·주소 조각, 그리고 작성 화면의 말투
// 유형이 하나 늘면 여기만 고치면 선택·작성·보낸 편지 제목이 함께 따라온다
import { MAILBOX_COMPOSE_PATH } from '@/shared/lib/routes';

import type { FeedbackType } from '../api/mailbox';

interface FeedbackTypeFace {
  emoji: string;
  // 선택 화면의 줄 이름. 보낸 편지의 제목은 서버가 유형 이름으로 내려준다
  label: string;
  // 주소에 실리는 조각 — 대문자 enum을 그대로 노출하지 않는다
  slug: string;
  // 작성 화면의 제목 — 유저는 이것만 읽는다고 보고, 무엇을 쓰면 되는지가 여기 다 있게 한다.
  // 두 줄로 끊되 아랫줄이 더 길게 — 윗줄이 길면 홀로 남은 꼬리처럼 보인다
  question: string;
  // 입력창 안 한 줄. 제목이 "뭘"을 말하니 여기는 "그걸 여기에"만 — 힌트를 더 얹으면 문턱이 생겨 덜 보내온다.
  // 작은 폰(320px)에서도 한 줄이어야 한다 — 15px 기준 240px 안쪽
  placeholder: string;
  // 입력창 아래 한 줄 — 읽는 사람이 있다는 걸 알리는 마음 한마디
  assurance: string;
  // 그 한마디 끝에 붙는 이모지. 문장과 나눠둬야 토스페이스 그림으로 그릴 수 있다
  assuranceEmoji: string;
}

export const FEEDBACK_TYPE_FACES: Record<FeedbackType, FeedbackTypeFace> = {
  BUG_REPORT: {
    emoji: '🐛',
    label: '문제 신고하기',
    slug: 'bug',
    question: '겪으신 문제를\n자세히 알려주세요',
    placeholder: '이곳에 문제 상황을 적어주세요',
    assurance: '알려주셔서 고마워요, 얼른 살펴볼게요',
    assuranceEmoji: '👀',
  },
  FEATURE_REQUEST: {
    emoji: '💡',
    label: '신규 기능 요청하기',
    slug: 'feature',
    question: '있었으면 하는\n기능을 알려주세요',
    placeholder: '이곳에 원하는 기능을 적어주세요',
    assurance: '여러분의 의견 하나하나가 모여 랜딧을 만들어요',
    assuranceEmoji: '🤗',
  },
  QUESTION: {
    emoji: '🙋',
    label: '궁금한 점 문의하기',
    slug: 'question',
    question: '궁금한 점이 있다면\n무엇이든 물어봐주세요',
    placeholder: '이곳에 궁금한 점을 적어주세요',
    assurance: '랜딧을 궁금해해 주셔서 고마워요',
    assuranceEmoji: '😊',
  },
  CHEER: {
    emoji: '🙌',
    label: '개발자 응원하기',
    slug: 'cheer',
    question: '응원하고 싶은\n내용을 남겨주세요',
    placeholder: '이곳에 응원 한마디를 적어주세요',
    assurance: '여러분의 응원 한 마디가 저희의 원동력이 돼요',
    assuranceEmoji: '🥹',
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

// 작성 흐름(목록 → 유형 선택 → 작성)은 히스토리에 한 층만 쓴다 — 진입·다음 단계·화살표 모두 replace,
// 보내면 보낸 편지함으로 replace. 보내고 나서 휴대폰 뒤로가기를 누르면 편지함이 아니라 들어오기 전 탭으로 나가야 해서다.
// 진입 주소(MAILBOX_COMPOSE_PATH)는 편지함 밖에서도 써서 shared/lib/routes에 있다

// 유형을 주소 조각으로 실어 보낸다. 되돌리는 쪽은 바로 위 readFeedbackType — 왕복이 한 파일에 있다
export const feedbackComposePath = (type: FeedbackType) =>
  `${MAILBOX_COMPOSE_PATH}/${FEEDBACK_TYPE_FACES[type].slug}`;
