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

// 발화 시간 추정치 — mp3 로드 실패 시 폴백 타이머가 이 식으로 발화 길이를 흉내 낸다
export const estimateSpeechMs = (text: string) =>
  Math.max(2500, text.length * 75);

// 미리 합성해 번들한 온보딩 사운드 mp3 경로 (인덱스 = SOUND_QUESTIONS 순서)
export const soundAudioSrc = (index: number) =>
  `/audio/onboarding-sound-${index}.mp3`;

// 로테이션 중복 회피 — 현재를 뺀 나머지 중 하나를 고른다 (문구가 하나뿐이면 그대로).
// current 이상 위치를 한 칸 밀어 current를 건너뛴다 — 루프 없이 항상 다른 인덱스를 보장한다.
export const pickNextIndex = (
  current: number,
  length: number,
  rand: () => number = Math.random,
): number => {
  if (length <= 1) return current;
  const offset = Math.floor(rand() * (length - 1));
  return (current + 1 + offset) % length;
};
