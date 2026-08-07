// 리마인더 예약 계획 검증 — 지난 시각 필터 경계와 오프셋 ISO 파싱 계약
import type { Reminder } from '@landit/bridge';

import { planReminders } from './reminder-schedule';

const reminderAt = (notifyAt: string): Reminder => ({
  notifyAt,
  title: '오늘의 시나리오',
  body: '카페에서 주문하기가 기다리고 있어요',
  url: '/scenario',
});

describe('planReminders', () => {
  it('지난 시각은 거르고 앞으로 올 시각만 남긴다', () => {
    const now = new Date('2026-07-30T20:00:00+09:00');
    const reminders = [
      reminderAt('2026-07-30T19:59:00+09:00'),
      reminderAt('2026-07-30T20:01:00+09:00'),
    ];

    const planned = planReminders(reminders, now);

    expect(planned).toHaveLength(1);
    expect(planned[0].notifyAt).toBe('2026-07-30T20:01:00+09:00');
  });

  it('현재와 정확히 같은 시각도 지난 것으로 본다', () => {
    const now = new Date('2026-07-30T20:00:00+09:00');

    const planned = planReminders(
      [reminderAt('2026-07-30T20:00:00+09:00')],
      now,
    );

    expect(planned).toHaveLength(0);
  });

  it('빈 배열이면 빈 계획을 돌려준다', () => {
    expect(planReminders([], new Date())).toEqual([]);
  });

  it('오프셋 붙은 ISO 시각을 절대 시각으로 파싱한다', () => {
    // +09:00의 20시는 UTC 11시 — 파싱이 오프셋을 무시하면 이 값이 어긋난다
    const now = new Date('2026-07-30T10:00:00Z');

    const planned = planReminders(
      [reminderAt('2026-07-30T20:00:00+09:00')],
      now,
    );

    expect(planned[0].date.getTime()).toBe(Date.parse('2026-07-30T11:00:00Z'));
  });
});
