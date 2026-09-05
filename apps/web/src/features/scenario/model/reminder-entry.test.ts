// 알림 진입 판정 — BE 푸시의 UTM을 알아보고, 어떤 유입이든 주소에서 UTM을 지운다
import { afterEach, describe, expect, it } from 'vitest';

import { consumeReminderEntry } from './reminder-entry';

const visit = (search: string) =>
  window.history.replaceState(null, '', `/scenario${search}`);

afterEach(() => window.history.replaceState(null, '', '/'));

describe('consumeReminderEntry', () => {
  it('오늘의 시나리오 리마인드 알림(BE 값)으로 들어오면 true를 돌려주고 UTM을 지운다', () => {
    visit(
      '?utm_source=push&utm_medium=notification&utm_campaign=daily_scenario_reminder',
    );

    expect(consumeReminderEntry()).toBe(true);
    expect(window.location.search).toBe('');
  });

  it('구 로컬 알림 주소(daily_reminder)도 리마인드로 본다', () => {
    visit('?utm_source=landit&utm_medium=push&utm_campaign=daily_reminder');

    expect(consumeReminderEntry()).toBe(true);
  });

  it('다른 캠페인·위젯 유입은 리마인드가 아니지만 UTM은 지운다 — 다른 쿼리는 남긴다', () => {
    visit('?date=2026-09-04&utm_medium=widget&utm_campaign=streak_widget');

    expect(consumeReminderEntry()).toBe(false);
    expect(window.location.search).toBe('?date=2026-09-04');
  });

  it('캠페인 이름만 맞고 알림 medium이 없으면 리마인드가 아니다', () => {
    visit('?utm_campaign=daily_scenario_reminder');

    expect(consumeReminderEntry()).toBe(false);
  });

  it('UTM이 없으면 주소를 건드리지 않는다', () => {
    visit('?date=2026-09-04');

    expect(consumeReminderEntry()).toBe(false);
    expect(window.location.search).toBe('?date=2026-09-04');
  });
});
