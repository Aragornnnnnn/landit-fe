// 판매 판정 배선 — 실제 규칙과 시계를 돌려, 종료 시각을 넘는 순간 열려 있던 화면의 판정이 바뀌는지 확인한다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { pinOfferClock } from './offer-clock';
import { useOffers } from './useOffers';

// 2026-11-20 00:00 KST — vi.hoisted 안에서는 import한 값을 쓸 수 없어 숫자로 적는다
const MIDNIGHT = vi.hoisted(() => Date.UTC(2026, 10, 19, 15));

// 같은 객체를 돌려준다 — 부를 때마다 새 객체면 구독 훅이 끝없이 다시 그린다
const shell = vi.hoisted(() => ({
  platform: 'ios',
  appVersion: '1.4.0',
  buildNumber: '18',
  bridgeVersion: 8,
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: () => shell,
}));
vi.mock('../paywall-gate/payment-flag', () => ({
  REWARD_CHALLENGE_ENABLED: true,
}));
vi.mock('../exit-promo/promo-flag', () => ({ PROMO_ENABLED: true }));
vi.mock('./offer-schedule', () => ({
  REWARD_SALE_UNTIL: MIDNIGHT,
  REFERRAL_UNTIL: MIDNIGHT,
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MIDNIGHT - 1000);
});
afterEach(() => {
  pinOfferClock(null);
  vi.useRealTimers();
});

describe('useOffers', () => {
  it('종료 1초 전에는 환급과 친구 초대가 열려 있다', () => {
    const { result } = renderHook(() => useOffers());

    expect(result.current).toMatchObject({
      rewardView: true,
      rewardSale: true,
      referral: true,
      previewFlow: true,
    });
  });

  it('화면을 켜 둔 채 종료 시각을 넘기면 판매와 초대가 닫히고 환급 화면은 남는다', () => {
    const { result } = renderHook(() => useOffers());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toMatchObject({
      rewardView: true,
      rewardSale: false,
      referral: false,
      previewFlow: true,
    });
  });

  it('종료 뒤의 한국어 화면은 환급 판매·초대·프리뷰 판정이 일본어 화면과 같다', () => {
    vi.setSystemTime(MIDNIGHT);
    const korean = renderHook(() => useOffers()).result.current;
    setTestLocale('ja');
    const japanese = renderHook(() => useOffers()).result.current;

    expect([korean.rewardSale, korean.referral, korean.previewFlow]).toEqual([
      japanese.rewardSale,
      japanese.referral,
      japanese.previewFlow,
    ]);
  });

  it('개발자 점검에서 종료 뒤로 고정하면 종료 전에도 닫힌 화면을 본다', () => {
    const { result } = renderHook(() => useOffers());

    act(() => pinOfferClock('ended'));

    expect(result.current.rewardSale).toBe(false);
    expect(result.current.rewardView).toBe(true);
  });

  it('개발자 점검에서 판매 중으로 고정하면 종료 뒤에도 열린 화면을 본다', () => {
    vi.setSystemTime(MIDNIGHT + 1000);
    const { result } = renderHook(() => useOffers());

    act(() => pinOfferClock('selling'));

    expect(result.current.rewardSale).toBe(true);
  });
});
