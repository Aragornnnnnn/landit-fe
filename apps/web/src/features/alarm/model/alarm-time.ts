// 알람 시각 — 서버 "HH:mm"(기기 현지 시각)을 시·분으로 읽는다
import type { AlarmTime } from '@landit/bridge';

// 처음 켜는 사람에게 보여 줄 시각
export const DEFAULT_ALARM_TIME: AlarmTime = { hour: 19, minute: 0 };

const SERVER_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

// 비어 있거나 형식이 깨졌으면 기본 시각
export const parseAlarmTime = (time: string | null): AlarmTime => {
  const match = time?.match(SERVER_TIME);
  if (!match) return DEFAULT_ALARM_TIME;
  return { hour: Number(match[1]), minute: Number(match[2]) };
};
