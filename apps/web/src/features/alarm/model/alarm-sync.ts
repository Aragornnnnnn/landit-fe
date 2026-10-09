// 셸 알람 맞추기 — 서버 설정으로 걸려 있어야 할 시나리오 알람을 정하고, 셸에 걸린 알람과 비교해 보낼 요청을 고른다
import type {
  AlarmSchedule,
  AlarmStatus,
  RepeatingAlarm,
  RepeatingAlarmState,
} from '@landit/bridge';

import type { UserAlarmResponse } from '../api/alarm';
import { parseAlarmTime } from './alarm-time';
import { ALARM_PATH, ALARM_TITLE, ALARM_TYPE } from './shell-alarm';

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

export type DesiredAlarm = Pick<RepeatingAlarm, 'title' | 'schedules' | 'path'>;

export type AlarmCommand =
  | { kind: 'set'; alarm: DesiredAlarm | null; skipToday: boolean }
  | { kind: 'skip' };

/* 무엇을 걸지 — 서버 설정·구독·오늘 시나리오로 셸에 걸려 있어야 할 알람을 정한다 */

export interface AlarmInputs {
  userId: number | null;
  setting: UserAlarmResponse | undefined;
  subscription: { premium: boolean } | null;
  subscriptionFailed: boolean;
  isAdmin: boolean;
  daily: { date: string; scenario?: { completed: boolean } | null } | null;
  scenarioLoading: boolean;
  // 기기의 오늘 (YYYY-MM-DD) — 셸이 기기 날짜로 오늘 회차를 빼서, 끝낸 날도 기기 날짜와 비교한다
  today: string;
}

// 서버 설정으로 걸려 있어야 할 알람 — 꺼져 있으면 null. 지금은 매일 같은 시각 하나다
export const desiredAlarm = (
  setting: UserAlarmResponse,
): DesiredAlarm | null => {
  if (!setting.enabled) return null;
  const { hour, minute } = parseAlarmTime(setting.time);
  return {
    title: ALARM_TITLE,
    schedules: [{ hour, minute, weekdays: EVERY_DAY }],
    path: ALARM_PATH,
  };
};

// 걸 알람이 있을 사람인가 — 알람을 켰고 유료이거나 ADMIN(결제 없이 실제 흐름을 시험하려고)
export const wantsAlarm = ({
  setting,
  subscription,
  isAdmin,
}: Pick<AlarmInputs, 'setting' | 'subscription' | 'isAdmin'>) =>
  setting?.enabled === true && (subscription?.premium === true || isAdmin);

/**
 * 셸에 걸려 있어야 할 알람과 오늘 끝낸 날짜를 정한다. 아직 정할 수 없으면 'wait'.
 * desired가 null이면 "알람을 지워라"는 뜻이라, 기다리라는 뜻과 헷갈리지 않게 'wait'를 따로 둔다.
 * - 구독을 모르거나 조회가 실패하면 손대지 않는다 — 유료 사용자의 알람을 잘못 끄는 게 더 큰 사고다
 * - 알람을 걸 사람이면 오늘 끝냈는지 알고 나서 정한다 — 모른 채 걸면 끝낸 날에도 울린다.
 *   조회가 실패하면 모르는 채로 건다 — 안 울리는 것보다 끝낸 날 한 번 더 울리는 게 낫다
 * - 로그아웃이면 끈다 — 다음 사람이 앞 계정의 알람을 받지 않게
 * - 끝낸 날이 기기의 오늘일 때만 넘긴다 — 앱을 켠 채 자정을 넘기면 어제 기록으로 새 날 회차를 빼게 된다
 */
export const alarmTarget = (
  inputs: AlarmInputs,
): { desired: DesiredAlarm | null; doneOn: string | null } | 'wait' => {
  const {
    userId,
    setting,
    subscription,
    subscriptionFailed,
    daily,
    scenarioLoading,
    today,
  } = inputs;
  if (userId === null) return { desired: null, doneOn: null };
  if (!setting || !subscription || subscriptionFailed) return 'wait';

  const wanted = wantsAlarm(inputs);
  // 걸 사람이 아니면 오늘 시나리오를 조회하지 않아 계속 '조회 중'으로 보인다 — 그때는 기다리지 않는다
  if (wanted && scenarioLoading) return 'wait';

  const desired = wanted ? desiredAlarm(setting) : null;
  const doneOn =
    daily?.scenario?.completed && daily.date === today ? daily.date : null;
  return { desired, doneOn };
};

/* 언제 보낼지 — 셸에 걸린 알람과 비교해 보낼 요청을 고른다 */

const scenarioAlarmOf = (status: AlarmStatus) =>
  status.repeatingAlarms.find(({ alarmType }) => alarmType === ALARM_TYPE) ??
  null;

// 스케줄·요일 순서가 달라도 같은 알람으로 본다
const scheduleKey = (schedules: AlarmSchedule[]) =>
  JSON.stringify(
    schedules
      .map(({ hour, minute, weekdays }) => [
        hour,
        minute,
        [...weekdays].sort((a, b) => a - b),
      ])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );

const isAlreadyScheduled = (
  desired: DesiredAlarm,
  scheduled: RepeatingAlarmState,
) =>
  desired.path === scheduled.path &&
  scheduleKey(desired.schedules) === scheduleKey(scheduled.schedules);

// 셸 상태가 올 때마다 다시 걸지, 오늘 회차를 건너뛸지 정하는 함수를 만든다 — 보낸 요청을 기억해 같은 걸 또 보내지 않는다
export const createAlarmDecider = () => {
  let lastSent: string | null = null;
  let lastSkipped: string | null = null;

  /**
   * @param doneOn 오늘 시나리오를 끝냈으면 그 날짜, 아니면 null
   * @returns 셸에 보낼 요청. 보낼 게 없으면 null
   */
  return (
    desired: DesiredAlarm | null,
    status: AlarmStatus,
    doneOn: string | null,
  ): AlarmCommand | null => {
    if (!status.supported) return null;
    // 권한을 아직 안 물었으면 걸지 않는다 — iOS는 거는 순간 권한 팝업이 떠서, 알람을 켜는 화면이 아닌 곳에서 묻게 된다
    if (desired && status.permission === 'undetermined') return null;

    const scheduled = scenarioAlarmOf(status);
    const matches = desired
      ? scheduled !== null && isAlreadyScheduled(desired, scheduled)
      : scheduled === null;

    if (!matches) {
      // 같은 요청은 권한이 바뀌기 전까지 한 번만 보낸다 — 셸이 못 걸면 상태가 그대로라 끝없이 보내게 된다
      const key = JSON.stringify([
        desired,
        status.permission,
        status.exactAlarm,
        status.fullScreen,
        status.notifications,
      ]);
      if (key === lastSent) return null;
      lastSent = key;
      // 오늘 끝낸 날이면 처음부터 오늘 회차를 빼고 건다 — 걸고 나서 건너뛰면 그 사이 틈이 생긴다
      const skipToday = desired !== null && doneOn !== null;
      lastSkipped = skipToday ? doneOn : null;
      return { kind: 'set', alarm: desired, skipToday };
    }
    lastSent = null;

    // 걸린 뒤에 오늘 시나리오를 끝냈으면 오늘 회차를 건너뛴다. 같은 날엔 한 번만 —
    // 울릴 시각이 이미 지나 셸이 건너뛰지 않으면 상태의 skipDate가 안 바뀐다
    if (!desired || !doneOn) return null;
    if (scheduled?.skipDate === doneOn || lastSkipped === doneOn) return null;
    lastSkipped = doneOn;
    return { kind: 'skip' };
  };
};
