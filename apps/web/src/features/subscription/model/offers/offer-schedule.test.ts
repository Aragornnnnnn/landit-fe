// 판매 종료 시각 읽기 — 배포 설정이 없거나 잘못 적혀도 코드에 적은 시각으로 끝나는지 확인한다
import { describe, expect, it } from 'vitest';

import {
  parseUntil,
  REFERRAL_UNTIL,
  resolveUntil,
  REWARD_SALE_UNTIL,
} from './offer-schedule';

const WRITTEN = '2026-11-20T00:00:00+09:00';
const MIDNIGHT = Date.UTC(2026, 10, 19, 15);

describe('parseUntil', () => {
  it('한국 시간으로 적은 시각을 그 순간으로 읽는다', () => {
    expect(parseUntil(WRITTEN)).toBe(MIDNIGHT);
  });

  it.each([undefined, '', '내일', 'true'])(
    '%s처럼 시각이 아닌 값은 없는 것으로 읽는다',
    (value) => {
      expect(parseUntil(value)).toBeNull();
    },
  );
});

describe('코드에 적은 종료 시각', () => {
  // 11월 20일 23:59:59(KST)까지 팔고 21일 0시에 닫는다
  const LAST_SECOND = Date.parse('2026-11-20T23:59:59+09:00');

  it('환급 판매는 11월 20일 마지막 순간까지 열려 있고 21일 0시에 끝난다', () => {
    expect(REWARD_SALE_UNTIL).toBe(LAST_SECOND + 1000);
  });

  it('친구 초대도 같은 시각에 끝난다', () => {
    expect(REFERRAL_UNTIL).toBe(LAST_SECOND + 1000);
  });
});

describe('resolveUntil', () => {
  it('배포 설정이 없으면 코드에 적은 시각에 끝난다', () => {
    expect(resolveUntil(undefined, WRITTEN)).toBe(MIDNIGHT);
  });

  it.each(['', '2026-11-2O', 'true'])(
    '배포 설정을 %s처럼 잘못 적어도 코드에 적은 시각에 끝난다',
    (override) => {
      expect(resolveUntil(override, WRITTEN)).toBe(MIDNIGHT);
    },
  );

  it('배포 설정에 미래 시각을 넣으면 그 시각까지 다시 연다', () => {
    expect(resolveUntil('2027-03-01T00:00:00+09:00', WRITTEN)).toBe(
      Date.UTC(2027, 1, 28, 15),
    );
  });
});
