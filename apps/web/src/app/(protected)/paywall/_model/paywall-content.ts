// 롱 페이월의 고정 문구와 그림 — 학습 단계 카드, 대화 카드, 데이터 수치, 리뷰. 아래쪽에 환급 챌린지 값도 있다(하루 몫과 최대 환급액 산식은 features/reward의 refund-offer). 피그마 「페이월 v2」(2640:8041) 기준
import type { SubscriptionPlan } from '@landit/analytics';

import { rewardOfferOf } from '@/features/reward/model/refund-offer';
import { formatWon } from '@/features/subscription/lib/won';
import { PASS_FALLBACK_PRICE } from '@/features/subscription/model/product/offering';
import type { Locale } from '@/shared/i18n/locale';
import type { PreloadableImage } from '@/shared/lib/preload-next-images';

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
 * 한 표현이 상황마다 어떻게 쓰이는지 카드가 옆으로 넘어가며 보여준다. 뜻과 해석은 paywall.usageDemo 문구다
 */
export const USAGE_EXPRESSION = {
  text: 'give it a shot',
  examples: [
    {
      question: 'Do you think I should try it?',
      sentence: ['Why not ', 'give it a shot', '? You might like it.'],
      translationKey: 'firstTranslationBody',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-1.webp`,
    },
    {
      question: 'How did she discover she liked baking?',
      sentence: ['She ', 'gave baking a shot', ' and loved it.'],
      translationKey: 'secondTranslationBody',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-2.webp`,
    },
    {
      question: 'Is it worth trying?',
      sentence: ["It's worth ", 'giving it a shot', '.'],
      translationKey: 'thirdTranslationBody',
      image: `${IMAGE_DIR}/give-it-a-shot/ex-3.webp`,
    },
    {
      question: "I'm afraid I'll fail.",
      sentence: ['', 'Give it a go', " — what's the worst that can happen?"],
      translationKey: 'fourthTranslationBody',
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

/** 시나리오 카드 제목 — paywall.scenarios 아래 문구 키 */
export type ScenarioTitleKey =
  | 'cafeOrderTitle'
  | 'hotelCheckInTitle'
  | 'flightSeatmateTitle'
  | 'pharmacyTitle'
  | 'debateClassTitle'
  | 'trainTicketTitle'
  | 'refundRequestTitle'
  | 'partyChloeTitle'
  | 'seatChangeTitle'
  | 'travelChatTitle'
  | 'groupPresentationTitle'
  | 'headphonesTitle'
  | 'roommateMarcoTitle'
  | 'baggageClaimTitle';

/** 시나리오 데모에서 넘어가는 실제 시나리오 카드(제목·썸네일). 끝에서 두 번째 장(첫 만남)에 멈춘다. 그림은 CDN 원본을 216px로 줄여 담았다 */
export const SCENARIOS: { titleKey: ScenarioTitleKey; image: string }[] = [
  {
    titleKey: 'cafeOrderTitle',
    image: `${IMAGE_DIR}/scenarios/s-17.webp`,
  },
  {
    titleKey: 'hotelCheckInTitle',
    image: `${IMAGE_DIR}/scenarios/s-15.webp`,
  },
  {
    titleKey: 'flightSeatmateTitle',
    image: `${IMAGE_DIR}/scenarios/s-13.webp`,
  },
  {
    titleKey: 'pharmacyTitle',
    image: `${IMAGE_DIR}/scenarios/s-18.webp`,
  },
  {
    titleKey: 'debateClassTitle',
    image: `${IMAGE_DIR}/scenarios/s-12.webp`,
  },
  {
    titleKey: 'trainTicketTitle',
    image: `${IMAGE_DIR}/scenarios/s-26.webp`,
  },
  {
    titleKey: 'refundRequestTitle',
    image: `${IMAGE_DIR}/scenarios/s-39.webp`,
  },
  {
    titleKey: 'partyChloeTitle',
    image: `${IMAGE_DIR}/scenarios/s-06.webp`,
  },
  {
    titleKey: 'seatChangeTitle',
    image: `${IMAGE_DIR}/scenarios/s-30.webp`,
  },
  {
    titleKey: 'travelChatTitle',
    image: `${IMAGE_DIR}/scenarios/s-20.webp`,
  },
  {
    titleKey: 'groupPresentationTitle',
    image: `${IMAGE_DIR}/scenarios/s-09.webp`,
  },
  {
    titleKey: 'headphonesTitle',
    image: `${IMAGE_DIR}/scenarios/s-37.webp`,
  },
  {
    titleKey: 'roommateMarcoTitle',
    image: `${IMAGE_DIR}/scenarios/s-01.webp`,
  },
  {
    titleKey: 'baggageClaimTitle',
    image: `${IMAGE_DIR}/scenarios/s-14.webp`,
  },
];

/** 평점·리뷰는 한국 스토어에 달린 한국어 글이라 한국어 화면에서만 보인다 — 일본 스토어엔 아직 평점이 없다 */
export const showsStoreReviews = (locale: Locale) => locale === 'ko';

export const STORE_RATING = 4.8;
/** 평점을 확인한 날 — 숫자 옆에 "○○ 기준"으로 붙는다 */
export const STORE_RATING_AS_OF = '2026.10.06';

/** 평점 기준 시점을 연·월로 줄인 한 마디 — "2026.10.06" → "(26년 10월 기준)" */
export const ratingAsOfLabel = (asOf: string) => {
  const [year, month] = asOf.split('.');
  return `(${year.slice(2)}년 ${Number(month)}월 기준)`;
};

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
    // 제목은 스토어 글에 없어 본문 내용 그대로 붙였다. 닉네임은 스토어에 가려진 채로 보이는 그대로다
    title: '진짜 원어민이랑 대화하는 느낌!',
    body: '원어민과 실제로 대화하는 느낌이 들어서 좋았어요. 제가 한 말을 바로 피드백 해 줘서 많이 도움 됐어요.',
    author: '박 ****',
    date: '2026.09.16',
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

/** 환급 챌린지로 파는 상품 — 100일 이용권 하나(한 번 결제하는 단건 상품) */
export const REWARD_PLAN_ID = 'pass' satisfies SubscriptionPlan;

/** 환급 챌린지 화면에 그릴 값 */
export interface RewardPlan {
  days: number;
  /** 결제 금액 */
  price: number;
  /** 오늘의 시나리오를 끝낸 날 쌓이는 금액 */
  dailyRefund: number;
  /** 하루도 빠짐없이 채웠을 때 돌려받는 금액 */
  maxRefund: number;
}

/**
 * 결제 금액으로 환급 챌린지 값을 만든다 — 하루 몫은 결제 금액을 일수로 나눈 값(원 단위 내림)이고, 다 채우면 그 합을 돌려받는다.
 * 금액을 여기 박아 두지 않아, 가격이 다른 이용권을 오퍼링에 올리기만 하면 화면이 따라온다(가격 실험).
 *
 * @param price 셸이 준 원화 가격. 없으면 등록값
 */
export const buildRewardPlan = (
  price: number = PASS_FALLBACK_PRICE,
): RewardPlan => {
  const { days, dailyWon, maximumWon } = rewardOfferOf(price);
  return { days, price, dailyRefund: dailyWon, maxRefund: maximumWon };
};

/**
 * 카드 벽 그림 한 장 — 원본이 이미 216px webp로 작게 줄여 둔 파일이라 최적화 서버를 거치지 않고 파일을 그대로 받는다.
 * 최적화 주소는 열 때마다 서버에 다시 묻는 캐시(max-age=0)라 카드가 늦게 차고, 원본 주소는 next.config가 하루 캐시를 붙인다
 */
export const scenarioWallImageOf = (src: string): PreloadableImage => ({
  src,
  width: 128,
  height: 192,
  unoptimized: true,
});

/** 카드 벽에 깔리는 그림 전부 — 페이월로 오기 전 화면(대화 직후·홈 프리뷰)이 미리 받는다 */
export const SCENARIO_WALL_IMAGES = SCENARIOS.map(({ image }) =>
  scenarioWallImageOf(image),
);

/** 오늘의 시나리오로 뽑혀 카드 벽 가운데 놓이는 시나리오 — 처음 만난 클로이와 파티에서 대화하는 장면이 가장 해 보고 싶게 만든다 */
export const WALL_PICK_INDEX = SCENARIOS.findIndex((scenario) =>
  scenario.image.endsWith('/s-06.webp'),
);

/**
 * 결제 금액 안내의 비교표 줄 — 환급 챌린지는 적립을 프리미엄 둘째 줄에 넣는다. 글자가 많으면 읽기 힘들어 짧게 쓴다
 *
 * @param dailyRefund 오늘의 시나리오를 끝낸 날 쌓이는 금액
 */
export const rewardBenefitsOf = (
  dailyRefund: number,
): { text: string; free: boolean }[] => [
  { text: '매일 새 시나리오', free: true },
  { text: `시나리오마다 ${formatWon(dailyRefund)} 적립`, free: false },
  { text: '문장별 꼼꼼한 피드백', free: false },
  { text: '맞춤 원어민 표현', free: false },
  { text: '원어민 발음 비교', free: false },
  { text: '무제한 프리톡', free: false },
];
