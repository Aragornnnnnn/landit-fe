// 알람 한 줄 요약 — 내 정보 알람 행 오른쪽 값. 권한이 막혀 안 울리면 시각보다 그걸 먼저 알린다
import { formatAlarmTime, parseAlarmTime } from './alarm-time';

export const alarmSummary = ({
  registered,
  blocked,
  time,
}: {
  registered: boolean;
  blocked: boolean;
  time: string | null;
}) => {
  if (!registered) return { text: '없음', alert: false };
  if (blocked) return { text: '권한 필요', alert: true };
  return {
    text: `매일 ${formatAlarmTime(parseAlarmTime(time))}`,
    alert: false,
  };
};
