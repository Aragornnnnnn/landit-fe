// 매일 KST 20시 리마인드 목록을 만든다 — 완료 여부와 무관하게 전 일수를 깐다 (클리어 시 오늘 취소는 후속: 오늘 뺀 목록을 재발신하면 된다)
import type { Reminder } from '@landit/bridge';

import { REMINDER_COPIES } from './reminder-copies';

// 예약 일수 — iOS 대기 알림 상한 64개에서 다른 알림용 여유를 남긴 값
export const REMINDER_DAYS = 50;

// 알림 탭 목적지 — UTM 유입 딱지 (자리 규칙은 docs/analytics-utm.md). content는 문구 슬러그라 문구별 탭 성과가 나온다
const reminderUrl = (copySlug: string) =>
  `/home?utm_source=landit&utm_medium=push&utm_campaign=daily_reminder&utm_content=${copySlug}`;

// 서비스 타임존은 KST 고정 — 기기 타임존과 무관하게 한국 저녁 20시에 맞춘다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// now로부터 dayOffset일 뒤의 KST 달력 날짜 (YYYY-MM-DD)
const kstDate = (now: Date, dayOffset: number) => {
  const kst = new Date(now.getTime() + KST_OFFSET_MS + dayOffset * DAY_MS);
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${kst.getUTCFullYear()}-${month}-${day}`;
};

export const buildReminders = (now: Date): Reminder[] =>
  Array.from({ length: REMINDER_DAYS }, (_, dayOffset) => {
    const copy = REMINDER_COPIES[dayOffset % REMINDER_COPIES.length];
    return {
      notifyAt: `${kstDate(now, dayOffset)}T20:00:00+09:00`,
      title: copy.title,
      body: copy.body,
      url: reminderUrl(copy.slug),
    };
  });
