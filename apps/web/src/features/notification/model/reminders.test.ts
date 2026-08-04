// buildReminders — 문구 순환·일수·KST 20시 계산의 갈림길 검증
import { describe, expect, it } from 'vitest';

import { REMINDER_COPIES } from './reminder-copies';
import { buildReminders, REMINDER_DAYS } from './reminders';

// KST 2026-08-01 오전 10시
const TODAY = new Date('2026-08-01T10:00:00+09:00');

describe('buildReminders', () => {
  it('오늘부터 예약 일수만큼, 매일 KST 20시로 만든다', () => {
    const reminders = buildReminders(TODAY);

    expect(reminders).toHaveLength(REMINDER_DAYS);
    expect(reminders[0].notifyAt).toBe('2026-08-01T20:00:00+09:00');
    expect(reminders[1].notifyAt).toBe('2026-08-02T20:00:00+09:00');
    expect(reminders[REMINDER_DAYS - 1].notifyAt).toBe(
      '2026-09-19T20:00:00+09:00',
    );
  });

  it('문구를 순서대로 순환한다 — 문구 수를 넘어가면 처음으로 돌아온다', () => {
    const reminders = buildReminders(TODAY);
    const count = REMINDER_COPIES.length;

    expect(reminders[0].title).toBe(REMINDER_COPIES[0].title);
    expect(reminders[count - 1].body).toBe(REMINDER_COPIES[count - 1].body);
    expect(reminders[count].title).toBe(REMINDER_COPIES[0].title);
  });

  it('월말을 넘겨도 날짜가 이어진다', () => {
    const reminders = buildReminders(new Date('2026-08-31T09:00:00+09:00'));

    expect(reminders[0].notifyAt).toBe('2026-08-31T20:00:00+09:00');
    expect(reminders[1].notifyAt).toBe('2026-09-01T20:00:00+09:00');
  });

  it('해외 타임존에서 실행해도 KST 달력 기준으로 계산한다', () => {
    // KST 8/2 새벽 1시 = UTC 8/1 16시 — 어느 타임존이든 KST의 "오늘"은 8/2다
    const reminders = buildReminders(new Date('2026-08-01T16:00:00Z'));

    expect(reminders[0].notifyAt).toBe('2026-08-02T20:00:00+09:00');
  });

  it('모든 항목이 시나리오 탭 딥링크에 UTM 유입 표식을 달고, content는 문구 슬러그를 따라 순환한다', () => {
    const reminders = buildReminders(TODAY);
    const count = REMINDER_COPIES.length;

    for (const reminder of reminders) {
      expect(reminder.url).toMatch(
        /^\/scenario\?utm_source=landit&utm_medium=push&utm_campaign=daily_reminder&utm_content=\w+$/,
      );
    }
    expect(reminders[0].url).toContain(
      `utm_content=${REMINDER_COPIES[0].slug}`,
    );
    expect(reminders[count - 1].url).toContain(
      `utm_content=${REMINDER_COPIES[count - 1].slug}`,
    );
    // 문구 수를 넘어가면 슬러그도 처음으로 돌아온다 — 문구와 표식이 항상 짝을 이룬다
    expect(reminders[count].url).toContain(
      `utm_content=${REMINDER_COPIES[0].slug}`,
    );
  });
});
