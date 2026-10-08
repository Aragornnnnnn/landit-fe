// 롱 페이월의 고정 문구와 그림 — 학습 단계 카드, 대화 카드, 데이터 수치, 리뷰. 피그마 「페이월 v2」(2640:8041) 기준
import type { SubscriptionPlan } from '@landit/analytics';

const IMAGE_DIR = '/images/paywall';

/** 래디 표정 — 섹션 제목 옆에 하나씩 앉는다. 480px 정사각 */
export const RANDY = {
  wand: `${IMAGE_DIR}/randy-wand.webp`,
  cards: `${IMAGE_DIR}/randy-cards.webp`,
  heart: `${IMAGE_DIR}/randy-heart.webp`,
  peek: `${IMAGE_DIR}/randy-peek.webp`,
} as const;

/** 데모 화면 속 상황 그림 — 실제 표현 학습 화면에서 잘라 왔다 */
export const SCENE_IMAGES = {
  city: `${IMAGE_DIR}/demo-city.webp`,
} as const;

/**
 * 04 카드 「이렇게도 써요」 — 실제 표현 give it a shot의 추가 예문 넷(landit-be V44 문장 + V56 그림).
 * 한 표현이 상황마다 어떻게 쓰이는지 카드가 옆으로 넘어가며 보여준다
 */
export const USAGE_EXPRESSION = {
  text: 'give it a shot',
  meaning: '한번 해보다, 시도해 보다',
  examples: [
    {
      question: 'Do you think I should try it?',
      sentence: ['Why not ', 'give it a shot', '? You might like it.'],
      translation: '한번 해보지 그래? 마음에 들지도 몰라.',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-1.webp`,
    },
    {
      question: 'How did she discover she liked baking?',
      sentence: ['She ', 'gave baking a shot', ' and loved it.'],
      translation: '걔 베이킹 한번 해봤는데 완전 빠졌어.',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-2.webp`,
    },
    {
      question: 'Is it worth trying?',
      sentence: ["It's worth ", 'giving it a shot', '.'],
      translation: '한번 해볼 만한 가치는 있어.',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-3.webp`,
    },
    {
      question: "I'm afraid I'll fail.",
      sentence: ['', 'Give it a go', " — what's the worst that can happen?"],
      translation: '해봐. 잘못돼 봤자 뭐 얼마나 잘못되겠어?',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-4.webp`,
    },
  ],
} as const;

export interface ExampleCard {
  sentence: string;
  /** 문장 안에서 주황으로 짚을 표현 — sentence에 그대로 들어 있어야 한다 */
  highlight: string;
  image: string;
}

/**
 * 「다양한 예문」 카드 더미 — 실제 서비스 예문과 그 그림(landit-be V80 마이그레이션의 추가 예문).
 * 그림은 CDN 원본(1254px)을 타일 크기(300px)로 줄여 함께 담았다. 마지막 숫자가 그림 파일 번호다.
 * 넘기기가 멈춰 서는 카드(EXAMPLE_LANDING_INDEX) 뒤에도 몇 장을 남겨, 멈춘 뒤에도 줄이 계속 이어져 보이게 한다
 */
const EXAMPLE_ROWS: [sentence: string, highlight: string, file: number][] = [
  ['Yeah. Any chance you could help me out?', 'help me out', 1],
  ["I'm fine. Just remember to look after yourself too.", 'look after', 2],
  ["Relax, I'll take care of them.", 'take care of', 3],
  ["I haven't had time to settle in properly.", 'settle in', 4],
  ["I'm heating up some curry. Want some?", 'heating up', 5],
  ["Sure, I'll tidy up the kitchen.", 'tidy up', 6],
  ["I'm dressing up as a pirate this year.", 'dressing up', 7],
  ['Bundle up — it gets cold by the river at night.', 'Bundle up', 8],
  ['I did. I overslept again.', 'overslept', 9],
  ['I dozed off and woke up two stops later.', 'dozed off', 10],
  ["I just left. I'm on my way.", 'on my way', 11],
  ['I squeeze in a few pages on the subway.', 'squeeze in', 12],
  ["Careful, don't mix them up.", 'mix them up', 13],
  ["Now. If we wait, it'll just pile up.", 'pile up', 14],
  ['Yeah, the playground wore them out.', 'wore them out', 15],
  ['Yeah, I slept through all of them.', 'slept through', 16],
  ['Unfortunately. Four days in a row.', 'in a row', 17],
  ["No, we're already running late.", 'running late', 18],
  ['No, you need to pay in advance.', 'in advance', 19],
  ['To free up room for a bigger bed.', 'free up', 20],
  ['I make time for reading before bed.', 'make time for', 21],
  ["Let's hold off on announcing it for now.", 'hold off', 22],
  ["It's on hold until we get approval.", 'on hold', 23],
  ["Sure, let's push dinner back to seven.", 'push dinner back', 24],
  ['No, they called it off until morning.', 'called it off', 25],
  ["I paid already, so I can't back out now.", 'back out', 26],
  ['I hit the books every night after work.', 'hit the books', 36],
  ['Book ninety minutes in case we run over.', 'run over', 27],
  ['No, it only runs every other day.', 'every other day', 28],
  ['I promise. First thing when I wake up.', 'First thing', 29],
  ["He's tied up with a customer right now.", 'tied up', 30],
  ['No, you can still sign up for it online.', 'sign up for', 31],
  ['Finished and handed in. Freedom!', 'handed in', 32],
  ['Emphasis on "before." I\'m rusty now.', 'rusty', 33],
  ['Thanks, I made the sauce from scratch.', 'from scratch', 34],
  ['Not anymore. I know it by heart now.', 'by heart', 35],
];

export const EXAMPLE_CARDS: ExampleCard[] = EXAMPLE_ROWS.map(
  ([sentence, highlight, file]) => ({
    sentence,
    highlight,
    image: `${IMAGE_DIR}/examples/ex-${String(file).padStart(2, '0')}.webp`,
  }),
);

/** 넘기기가 멈춰 서는 카드 — 「hit the books」. 뒤로 아홉 장이 더 남는다 */
export const EXAMPLE_LANDING_INDEX = 26;

/** 멈춘 카드 아래에 붙는 해석과 표현 뜻 — 영어만 두면 "무슨 뜻이지"에서 멈춘다 */
export const EXAMPLE_LANDING_GLOSS = {
  translation: '퇴근하고 매일 밤 공부해.',
  meaning: '열심히 공부하다',
};

/** 시나리오 데모에서 넘어가는 실제 시나리오 카드(제목·썸네일). 끝에서 두 번째 장(첫 만남)에 멈춘다. 그림은 CDN 원본을 216px로 줄여 담았다 */
export const SCENARIOS: { title: string; image: string }[] = [
  {
    title: '카페에서 주문하기',
    image: `${IMAGE_DIR}/scenarios/s-17.webp`,
  },
  {
    title: '호텔 체크인 하기',
    image: `${IMAGE_DIR}/scenarios/s-15.webp`,
  },
  {
    title: '비행기 옆자리 승객과의 대화',
    image: `${IMAGE_DIR}/scenarios/s-13.webp`,
  },
  {
    title: '약국에서 증상 설명하고 약 사기',
    image: `${IMAGE_DIR}/scenarios/s-18.webp`,
  },
  {
    title: '토론 수업 — 돈과 행복',
    image: `${IMAGE_DIR}/scenarios/s-12.webp`,
  },
  {
    title: '일정에 맞는 기차표 구매하기',
    image: `${IMAGE_DIR}/scenarios/s-26.webp`,
  },
  {
    title: '불량 상품 교환 또는 환불 요청하기',
    image: `${IMAGE_DIR}/scenarios/s-39.webp`,
  },
  {
    title: '인터내셔널 파티 — 처음 만난 Chloe',
    image: `${IMAGE_DIR}/scenarios/s-06.webp`,
  },
  {
    title: '공항에서 더 편한 좌석으로 변경하기',
    image: `${IMAGE_DIR}/scenarios/s-30.webp`,
  },
  {
    title: '친구와 여행 수다 떨기',
    image: `${IMAGE_DIR}/scenarios/s-20.webp`,
  },
  {
    title: '조별 발표 준비하기',
    image: `${IMAGE_DIR}/scenarios/s-09.webp`,
  },
  {
    title: '기능과 가격을 비교해 헤드폰 고르기',
    image: `${IMAGE_DIR}/scenarios/s-37.webp`,
  },
  {
    title: '입주 첫날, 룸메이트 Marco와 첫 만남',
    image: `${IMAGE_DIR}/scenarios/s-01.webp`,
  },
  {
    title: '수하물 파손 — 카운터에 항의하기',
    image: `${IMAGE_DIR}/scenarios/s-14.webp`,
  },
];

export const STORE_RATING = 4.8;
/** 평점을 확인한 날 — 숫자 옆에 "○○ 기준"으로 붙는다 */
export const STORE_RATING_AS_OF = '2026.10.06';

export interface Review {
  title?: string;
  body: string;
  /** 스토어 닉네임 — 화면에는 maskName으로 가려서 보인다. 없으면 "스토어 리뷰" */
  author?: string;
  date?: string;
}

/** 스토어에 실제로 달린 리뷰 — 문구는 손대지 않는다 */
export const REVIEWS: Review[] = [
  {
    title: '최고에여!!!!!!',
    body: "'원어민 이해도'가 인상적!!! 내가 얼마나 원어민스럽게 말했는지를 수치로 보여준다는 점이 좋았어요!! 점점 수치가 늘어나는 모습을 볼 때마다 자신감이 붙기도 했답니다",
    author: '마먀먀먀',
    date: '2026.09.23',
  },
  {
    title: '영어 노베도 회화하고 싶다???? 랜딧 강추합니다!!',
    body: '덕분에 방구석에서도 영어 대화를 해보고 원어민과 제 발음비교도 할 수 있게됐어요.. 학원 나가기도 부끄러웠던 제가.. 이런 호사를 누려도 되는지..',
    author: 'qwaszx96',
    date: '2026.09.09',
  },
  {
    body: '원어민과 실제로 대화하는 느낌이 들어서 좋았어요. 제가 한 말을 바로 피드백 해 줘서 많이 도움 됐어요.',
  },
  {
    title: '도움 엄청 돼요',
    body: '실제 엄청 유용한 표현들을 수준에 맞게 알려주고 하루에 부담스럽지 않은 양으로 연습하게 해줘요.',
    author: '리움07',
    date: '2026.09.12',
  },
  {
    title: '무조건 쓰세요!!!',
    body: '다른 영어 학습 어플이랑은 다르게 편한 분위기에서 공부하는 느낌이 들어서 좋아요!',
  },
];

/**
 * 리뷰 닉네임 가리기 — 남의 닉네임을 그대로 광고에 쓰지 않는다.
 * 다섯 글자까지는 첫 글자, 그보다 길면 앞 두 글자만 남기고 나머지는 *. 한 글자여도 * 하나는 붙인다
 */
export const maskName = (name: string) => {
  const chars = [...name];
  const keep = chars.length > 5 ? 2 : 1;
  return (
    chars.slice(0, keep).join('') + '*'.repeat(Math.max(1, chars.length - keep))
  );
};

/** 환급 챌린지 기간 — 이 기간 동안 영어 공부를 이어 가면 결제 금액을 전액 돌려준다 */
export const REFUND_CHALLENGE_PERIOD = '6개월';
/** 그 기간 꾸준히 한 유저의 평균 습득 표현 수 */
export const LEARNABLE_EXPRESSION_COUNT = 726;
/** 그 기간 꾸준히 한 유저의 평균 대화 시간(분) */
export const AVERAGE_TALK_MINUTES = 1278;
/** 위 두 평균을 낸 날 */
export const OUTCOME_AS_OF = '2026.10.06';

/** 환급 플랜 — 기간·환급률·결제 금액. 결제는 아직 기존 상품(월간·연간)에 이어 둔다(3개월→월간, 6개월→연간) */
export const REFUND_PLANS: Record<
  SubscriptionPlan,
  { months: number; refundRate: number; price: number }
> = {
  monthly: { months: 3, refundRate: 80, price: 39_900 },
  yearly: { months: 6, refundRate: 100, price: 59_900 },
};

/** 최대 환급액 — 결제 금액 × 환급률(원 단위 반올림) */
export const getMaxRefund = (planId: SubscriptionPlan) => {
  const { price, refundRate } = REFUND_PLANS[planId];
  return Math.round((price * refundRate) / 100);
};
