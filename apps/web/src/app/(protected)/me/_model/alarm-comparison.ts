// 서버 알람 설정과 이 폰에 걸린 매일 알람을 견준다 — 내 정보의 개발자 묶음과 알람 점검 화면이 같이 쓴다
import type { AlarmStatus } from '@landit/bridge';

import type { UserAlarmResponse } from '@/features/alarm/api/alarm';
import { formatClock, parseAlarmTime } from '@/features/alarm/model/alarm-time';
import { ALARM_TYPE } from '@/features/alarm/model/shell-alarm';

/**
 * 서버 설정과 이 폰에 걸린 매일 알람을 나란히 놓는다.
 * 알람은 폰마다 따로 걸리고 앱을 열 때만 서버에 맞춰지므로, 다른 폰에서 바꾸면 이 폰은 옛 시각으로 남는다.
 *
 * @param setting 서버 알람 설정. 아직 못 받았으면 undefined — 모를 때는 어긋났다고 하지 않는다
 * @param status 셸이 알려 준 알람 상태. 알람을 모르는 셸이면 null
 */
export const compareWithServer = (
  setting: UserAlarmResponse | undefined,
  status: Pick<AlarmStatus, 'repeatingAlarms'> | null,
) => {
  const scenario = status?.repeatingAlarms.find(
    (alarm) => alarm.alarmType === ALARM_TYPE,
  );
  const phoneTime = scenario?.schedules[0] ?? null;
  const phone = phoneTime ? `매일 ${formatClock(phoneTime)}` : '없음';
  if (!setting) return { server: '불러오는 중', phone, differs: false };

  const serverTime = setting.enabled ? parseAlarmTime(setting.time) : null;
  const server = serverTime ? `매일 ${formatClock(serverTime)}` : '꺼짐';
  const sameTime =
    serverTime?.hour === phoneTime?.hour &&
    serverTime?.minute === phoneTime?.minute;
  return { server, phone, differs: !sameTime };
};
