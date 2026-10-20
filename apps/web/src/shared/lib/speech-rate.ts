// 말하기 속도 설정 — 마이페이지에서 고르고, 영어 음성을 트는 모든 곳이 읽는다. 기본이 1배라 1배가 아닐 때만 기기에 남는다
import { deviceSetting } from './device-setting';

/** 고를 수 있는 배속 — 느린 쪽부터 순서대로. 화면도 이 순서로 그린다 */
export const SPEECH_RATES = [0.75, 1, 1.25, 1.5] as const;

export type SpeechRate = (typeof SPEECH_RATES)[number];

export const DEFAULT_SPEECH_RATE: SpeechRate = 1;

const isSpeechRate = (value: number): value is SpeechRate =>
  (SPEECH_RATES as readonly number[]).includes(value);

// 목록 밖 저장값은 기본 1배로 본다 (손댄 값·옛 버전 값에 끌려가지 않게)
const speechRate = deviceSetting<SpeechRate>({
  key: 'landit-speech-rate',
  defaultValue: DEFAULT_SPEECH_RATE,
  parse: (saved) => {
    const rate = Number(saved);
    return isSpeechRate(rate) ? rate : undefined;
  },
});

/** 지금 배속 */
export const getSpeechRate = speechRate.get;

export const setSpeechRate = (rate: SpeechRate) => {
  // 목록 밖 값은 저장소에 들이지 않는다
  if (!isSpeechRate(rate)) return;
  speechRate.set(rate);
};

export const subscribeSpeechRate = speechRate.subscribe;
