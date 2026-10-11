// 알람 시각 — 서버 "HH:mm"(기기 현지 시각)을 시·분으로 읽고, 다시 서버 형식과 화면 글자로 바꾼다
import type { AlarmTime } from '@landit/bridge';

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

const meridiemLabel = (meridiem: 0 | 1) => (meridiem === 0 ? '오전' : '오후');

// "오후 7시", "오후 7시 25분" — 정각이면 분을 뺀다
export const formatAlarmTime = (time: AlarmTime) => {
  const { meridiem, hour12, minute } = toWheel(time);
  return minute === 0
    ? `${meridiemLabel(meridiem)} ${hour12}시`
    : `${meridiemLabel(meridiem)} ${hour12}시 ${minute}분`;
};

// "오후 7:05" — 다짐 문장 속 시각은 휠과 같은 모양으로 보여 준다
export const formatClock = (time: AlarmTime) => {
  const { meridiem, hour12, minute } = toWheel(time);
  return `${meridiemLabel(meridiem)} ${hour12}:${pad(minute)}`;
};
