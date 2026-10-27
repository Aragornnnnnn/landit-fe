// 알람 시각 — 서버 "HH:mm"(기기 현지 시각)을 시·분으로 읽고, 다시 서버 형식과 화면 글자로 바꾼다
import type { AlarmTime } from '@landit/bridge';

import type { Locale } from '@/shared/i18n/locale';

import { toWheel } from './time-wheel';

// 처음 등록하는 사람에게 보여 줄 시각
export const DEFAULT_ALARM_TIME: AlarmTime = { hour: 19, minute: 0 };

const SERVER_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

// 비어 있거나 형식이 깨졌으면 기본 시각
export const parseAlarmTime = (time: string | null): AlarmTime => {
  const match = time?.match(SERVER_TIME);
  if (!match) return DEFAULT_ALARM_TIME;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};

const pad = (value: number) => String(value).padStart(2, '0');

export const toServerTime = ({ hour, minute }: AlarmTime) =>
  `${pad(hour)}:${pad(minute)}`;

type ClockParts = ReturnType<typeof toWheel>;

/** 오전·오후 이름 — 시각 글자와 휠의 첫 칸이 같은 말을 쓴다 */
export const MERIDIEM_LABELS: Record<Locale, readonly [string, string]> = {
  ko: ['오전', '오후'],
  ja: ['午前', '午後'],
};

// 언어마다 한 줄 — 언어가 늘면 여기를 채우지 않고는 타입 검사를 못 지나간다
const CLOCK_FORMAT: Record<
  Locale,
  {
    // "오후 7시", "오후 7시 25분" — 정각이면 분을 뺀다
    alarmTime: (parts: ClockParts) => string;
    // "오후 7:05" — 다짐 문장 속 시각은 휠과 같은 모양으로 보여 준다
    clock: (parts: ClockParts) => string;
  }
> = {
  ko: {
    alarmTime: ({ meridiem, hour12, minute }) =>
      minute === 0
        ? `${MERIDIEM_LABELS.ko[meridiem]} ${hour12}시`
        : `${MERIDIEM_LABELS.ko[meridiem]} ${hour12}시 ${minute}분`,
    clock: ({ meridiem, hour12, minute }) =>
      `${MERIDIEM_LABELS.ko[meridiem]} ${hour12}:${pad(minute)}`,
  },
  ja: {
    alarmTime: ({ meridiem, hour12, minute }) =>
      minute === 0
        ? `${MERIDIEM_LABELS.ja[meridiem]}${hour12}時`
        : `${MERIDIEM_LABELS.ja[meridiem]}${hour12}時${minute}分`,
    clock: ({ meridiem, hour12, minute }) =>
      `${MERIDIEM_LABELS.ja[meridiem]}${hour12}:${pad(minute)}`,
  },
};

export const formatAlarmTime = (time: AlarmTime, locale: Locale) =>
  CLOCK_FORMAT[locale].alarmTime(toWheel(time));

export const formatClock = (time: AlarmTime, locale: Locale) =>
  CLOCK_FORMAT[locale].clock(toWheel(time));
