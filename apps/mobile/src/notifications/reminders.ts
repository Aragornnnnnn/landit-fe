// 웹이 보낸 예약 목록대로 로컬 알림을 통째로 다시 깐다 — 판단은 웹이 끝냈으므로 셸은 실행만 한다
import type { Reminder } from '@landit/bridge';
import * as Notifications from 'expo-notifications';

import {
  planReminders,
  REMINDER_CHANNEL_ID,
  REMINDER_KIND,
} from './reminder-schedule';

// 리마인더 표식이 붙은 것만 걷어낸다 — cancelAll·dismissAll은 다른 종류의 알림까지 지워서 쓰지 않는다
const clearOurReminders = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.kind === REMINDER_KIND)
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );

  // 이미 발사돼 알림 센터에 남은 것도 같은 기준으로 치운다 — 취소(예약분)와 정리(발사분)는 다른 일이다
  const presented = await Notifications.getPresentedNotificationsAsync();
  await Promise.all(
    presented
      .filter((item) => item.request.content.data?.kind === REMINDER_KIND)
      .map((item) =>
        Notifications.dismissNotificationAsync(item.request.identifier),
      ),
  );
};

export const syncReminders = async (reminders: Reminder[]) => {
  await clearOurReminders();

  await Promise.all(
    planReminders(reminders, new Date()).map(({ date, title, body, url }) =>
      Notifications.scheduleNotificationAsync({
        content: { title, body, data: { kind: REMINDER_KIND, url } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          // 채널을 지정해야 setup이 만든 채널(이름·중요도)로 게시된다 — iOS는 무시하는 값이라 무해하다
          channelId: REMINDER_CHANNEL_ID,
        },
      }),
    ),
  );
};
