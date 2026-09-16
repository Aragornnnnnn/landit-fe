// 말하기 속도 설정 — 마이페이지에서 고르고, 영어 음성을 트는 모든 곳이 읽는다. 기본이 1배라 1배가 아닐 때만 기기에 남는다
const STORAGE_KEY = 'landit-speech-rate';
const watchers = new Set<() => void>();

/** 고를 수 있는 배속 — 느린 쪽부터 순서대로. 화면도 이 순서로 그린다 */
export const SPEECH_RATES = [0.75, 1, 1.25, 1.5] as const;

export type SpeechRate = (typeof SPEECH_RATES)[number];

export const DEFAULT_SPEECH_RATE: SpeechRate = 1;

const isSpeechRate = (value: number): value is SpeechRate =>
  (SPEECH_RATES as readonly number[]).includes(value);

/** 지금 배속. 저장값이 없거나 목록 밖이면 기본 1배로 본다 (손댄 값·옛 버전 값에 끌려가지 않게) */
export const getSpeechRate = (): SpeechRate => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return DEFAULT_SPEECH_RATE;
    const rate = Number(saved);
    return isSpeechRate(rate) ? rate : DEFAULT_SPEECH_RATE;
  } catch {
    return DEFAULT_SPEECH_RATE;
  }
};

export const setSpeechRate = (rate: SpeechRate) => {
  // 목록 밖 값은 저장소에 들이지 않는다
  if (!isSpeechRate(rate)) return;
  try {
    if (rate === DEFAULT_SPEECH_RATE) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(rate));
  } catch {
    // 저장 실패는 무시한다 — 이번 세션만 반영되지 않을 뿐이다
  }
  watchers.forEach((notify) => notify());
};

/** useSyncExternalStore용 — 배속이 바뀌면 같은 문서의 구독자에게 알린다 */
export const subscribeSpeechRate = (onChange: () => void) => {
  watchers.add(onChange);
  return () => {
    watchers.delete(onChange);
  };
};
