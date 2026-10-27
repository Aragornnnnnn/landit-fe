// 발화 시간 표기 — 서버가 주는 밀리초를 "2분 41초"(일본어는 "2分41秒")처럼 읽히는 문장으로 바꾼다
import type { Locale } from '@/shared/i18n/locale';

const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;

// 초 미만은 버린다 — 올리면 한도를 넘겨 보이고, 초과분(음수)은 0으로 막는다
const toMinutesSeconds = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND_MS));
  return {
    minutes: Math.floor(totalSeconds / MINUTE_SECONDS),
    seconds: totalSeconds % MINUTE_SECONDS,
  };
};

// 분·초 단위 글자와 그 사이 띄어쓰기 — 일본어는 단위 사이를 띄우지 않는다
const UNITS: Record<Locale, { minute: string; second: string; gap: string }> = {
  ko: { minute: '분', second: '초', gap: ' ' },
  ja: { minute: '分', second: '秒', gap: '' },
};

export const toSpeakingTimeLabel = (ms: number, locale: Locale): string => {
  const { minutes, seconds } = toMinutesSeconds(ms);
  const { minute, second, gap } = UNITS[locale];

  if (minutes === 0) return `${seconds}${second}`;
  // 딱 떨어지는 분에 "0초"를 붙이지 않는다
  return seconds === 0
    ? `${minutes}${minute}`
    : `${minutes}${minute}${gap}${seconds}${second}`;
};

// 대화 중 줄어드는 시간 표기 — 초 단위로 깎이는 값이라 문장("41초") 대신 시계(0:41)로 읽힌다
export const toCountdownLabel = (ms: number): string => {
  const { minutes, seconds } = toMinutesSeconds(ms);

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
