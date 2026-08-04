// 리마인더 예약 계획 — 이미 지난 시각을 걸러 실제 예약할 목록만 남기는 순수 계산
import type { Reminder } from '@landit/bridge';

// 리마인더에 남기는 표식 — 다른 종류의 알림을 건드리지 않고 리마인더만 구분하기 위한 값
export const REMINDER_KIND = 'daily-reminder';

// 예약 시각을 Date로 파싱해 얹은 리마인더
export interface PlannedReminder extends Reminder {
  date: Date;
}

// 아직 오지 않은 시각만 남긴다 — 지난 시각은 OS가 예약을 거부하거나 즉시 발사해 버린다
export const planReminders = (
  reminders: Reminder[],
  now: Date,
): PlannedReminder[] =>
  reminders
    .map((reminder) => ({ ...reminder, date: new Date(reminder.notifyAt) }))
    .filter((reminder) => reminder.date.getTime() > now.getTime());
