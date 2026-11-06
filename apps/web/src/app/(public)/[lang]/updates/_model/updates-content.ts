// 업데이트 기록 내용 — 날짜는 App Store 버전 기록과 Google Play 첫 출시일을 확인해 적었다(2026-11-05). 롤플레이만 웹으로 나가 출시일 기준이다. 새 소식은 맨 위에 더한다.
// 일본어 화면은 문구를 일본어로 쓰고, 일본어로 다시 만든 그림(jaImage)이 있으면 그 그림을 쓴다
import type { Locale } from '@/shared/i18n/locale';

type UpdateText = { title: string; body: string };

type Update = {
  /** YYYY-MM-DD */
  date: string;
  image: string;
  jaImage?: string;
  tint: string;
  ko: UpdateText;
  ja: UpdateText;
};

const IMAGE_DIR = '/images/landing/updates';

export const UPDATES: Update[] = [
  {
    date: '2026-11-05',
    image: `${IMAGE_DIR}/roleplay.webp`,
    jaImage: `${IMAGE_DIR}/ja/roleplay.webp`,
    tint: '#fdeadb',
    ko: {
      title: '상상한 상황으로 롤플레이해요',
      body: '나와 상대의 역할, 상황만 정하면 바로 상황극이 시작돼요.',
    },
    ja: {
      title: '想像したシーンでロールプレイ',
      body: '自分と相手の役、場面を決めるだけで、すぐにロールプレイが始まります。',
    },
  },
  {
    date: '2026-10-15',
    image: `${IMAGE_DIR}/habit.webp`,
    tint: '#dff3e8',
    ko: {
      title: '매일 같은 시각에 알람으로 챙겨 드려요',
      body: '원하는 시각을 골라 두면 잠금화면에서 바로 오늘의 시나리오를 시작해요.',
    },
    ja: {
      title: '毎日同じ時間にアラームでお知らせ',
      body: '好きな時間を選んでおけば、ロック画面からすぐに今日のシナリオを始められます。',
    },
  },
  {
    date: '2026-09-26',
    image: `${IMAGE_DIR}/smalltalk.webp`,
    tint: '#e3f1fc',
    ko: {
      title: '스몰톡에도 피드백이 생겼어요',
      body: '스몰톡이 끝나면 오늘 나눈 대화를 한눈에 정리해 드려요.',
    },
    ja: {
      title: 'スモールトークにもフィードバック',
      body: 'スモールトークが終わると、今日の会話をひと目でわかるようにまとめます。',
    },
  },
  {
    date: '2026-09-17',
    image: `${IMAGE_DIR}/feedback-level.webp`,
    tint: '#e8e9fd',
    ko: {
      title: '쓸수록 나에게 맞춰지는 영어 학습',
      body: '첫 대화만 끝내면 실력을 알아보고, 내 수준에 맞춰 드려요.',
    },
    ja: {
      title: '使うほど自分に合っていく英語学習',
      body: '最初の会話を終えるだけで実力を見極め、レベルに合わせます。',
    },
  },
  {
    date: '2026-09-08',
    image: `${IMAGE_DIR}/pronunciation.webp`,
    jaImage: `${IMAGE_DIR}/ja/pronunciation.webp`,
    tint: '#fde6e8',
    ko: {
      title: '발음 평가가 생겼어요',
      body: '어느 단어가 원어민 같았고 어디를 다듬으면 좋을지 하나하나 짚어 드려요.',
    },
    ja: {
      title: '発音チェックが始まりました',
      body: 'どの単語がネイティブらしく、どこを直せばいいかを一つずつお伝えします。',
    },
  },
  {
    date: '2026-08-10',
    image: `${IMAGE_DIR}/daily.webp`,
    jaImage: `${IMAGE_DIR}/ja/daily.webp`,
    tint: '#fbf1dc',
    ko: {
      title: '매일 한 장, 오늘의 시나리오',
      body: '매일 새로운 대화 카드가 도착해요. 새 친구 테디도 함께예요.',
    },
    ja: {
      title: '毎日1枚、今日のシナリオ',
      body: '毎日新しい会話カードが届きます。新しい仲間のテディも一緒です。',
    },
  },
  {
    date: '2026-07-16',
    image: `${IMAGE_DIR}/appstore.webp`,
    tint: '#eef0f3',
    ko: {
      title: 'App Store에 출시했어요',
      body: '이제 iPhone에서도 랜딧으로 영어를 말해 볼 수 있어요.',
    },
    ja: {
      title: 'App Storeでリリース',
      body: 'iPhoneでもLanditで英語を話せるようになりました。',
    },
  },
  {
    date: '2026-06-15',
    image: `${IMAGE_DIR}/googleplay.webp`,
    tint: '#e6f6ee',
    ko: { title: 'Google Play에 출시했어요', body: '랜딧의 첫 출시예요.' },
    ja: {
      title: 'Google Playでリリース',
      body: 'Landitの最初のリリースです。',
    },
  },
];

/** 화면에 쓰는 날짜 — 한국어 '2026. 11. 5.', 일본어 '2026年11月5日' */
export const formatUpdateDate = (locale: Locale, date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return locale === 'ja'
    ? `${year}年${month}月${day}日`
    : `${year}. ${month}. ${day}.`;
};

/** 그 언어 화면에 그릴 기록 목록 */
export const updateEntries = (locale: Locale) =>
  UPDATES.map((update) => ({
    date: update.date,
    displayDate: formatUpdateDate(locale, update.date),
    image: (locale === 'ja' && update.jaImage) || update.image,
    tint: update.tint,
    ...update[locale],
  }));
