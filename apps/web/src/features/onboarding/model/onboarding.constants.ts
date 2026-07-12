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

// 발화 시간 추정치 — 하이라이트 진행과 발화 종료가 이 식 하나를 공유한다
export const estimateSpeechMs = (text: string) =>
  Math.max(2500, text.length * 75);
