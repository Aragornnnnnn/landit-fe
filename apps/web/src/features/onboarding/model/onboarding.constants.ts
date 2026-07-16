// 온보딩 스텝 순서와 사운드 확인 질문 상수
export const STEP_ORDER = [
  'intro',
  'sound',
  'mic',
  'thought',
  'scenario',
] as const;

export const SOUND_QUESTIONS = [
  'Hey! Can you hear me alright?',
  "Hi there! How's it going?",
  'Greetings! How are you doing today?',
  'Hello! Can you hear me clearly?',
  'Hi! Is my voice coming through okay?',
];

// 첫 발화는 항상 목록의 0번 — 로테이션 중복 회피 로직이 이 결합을 전제한다
export const FALLBACK_QUESTION = SOUND_QUESTIONS[0];

// 발화 시간 추정치 — mp3 로드 실패 시 폴백 타이머가 이 식으로 발화 길이를 흉내 낸다
export const estimateSpeechMs = (text: string) =>
  Math.max(2500, text.length * 75);

// 미리 합성해 번들한 온보딩 사운드 mp3 경로 (인덱스 = SOUND_QUESTIONS 순서)
export const soundAudioSrc = (index: number) =>
  `/audio/onboarding-sound-${index}.mp3`;

// 로테이션 중복 회피 — 현재와 다른 인덱스를 고른다 (문구가 하나뿐이면 그대로)
export const pickNextIndex = (
  current: number,
  length: number,
  rand: () => number = Math.random,
): number => {
  if (length <= 1) return current;
  let next = current;
  do {
    next = Math.floor(rand() * length);
  } while (next === current);
  return next;
};
