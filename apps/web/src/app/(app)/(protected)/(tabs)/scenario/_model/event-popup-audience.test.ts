// 이벤트 공지 대상 — 정기 구독 중인 사람만 빼고, 이용권·무료·받은 기간 사용자에게는 띄우는 규칙 검증
import { describe, expect, it } from 'vitest';

import type { MySubscription } from '@/features/subscription/api/subscription';

import { isEventPopupAudience } from './event-popup-audience';

const subscription = (premium: boolean, productId: string | null) =>
  ({ premium, productId }) as MySubscription;

describe('isEventPopupAudience', () => {
  it.each([
    ['무료 사용자', subscription(false, null), true],
    [
      '100일 이용권 사용자',
      subscription(true, 'com.saynow.app.pass.50000'),
      true,
    ],
    ['대시보드로 받은 기간 사용자', subscription(true, null), true],
    [
      '월간 구독자',
      subscription(true, 'com.saynow.app.premium.monthly'),
      false,
    ],
    [
      '연간 구독자(Play 베이스플랜 포함)',
      subscription(true, 'com.saynow.app.premium.yearly:annual'),
      false,
    ],
    [
      '구독이 끝난 사람',
      subscription(false, 'com.saynow.app.premium.monthly'),
      true,
    ],
  ])('%s면 대상 여부를 가른다', (_, given, expected) => {
    expect(isEventPopupAudience(given)).toBe(expected);
  });
});
