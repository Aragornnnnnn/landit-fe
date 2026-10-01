// 한시 할인 카운트다운 — 받은 순간을 기준으로 재고, 화면을 떠났다 돌아와도 맞아야 한다
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaywallPromo } from '@/features/subscription/api/subscription';

import { usePromoOffer } from './usePromoOffer';

// 끝나는 때는 할인마다 한 번만 정해지고 모듈에 남는다 — 테스트끼리 같은 할인을 쓰지 않게 매번 다른 시각을 준다
let expiresAt = '';
let serial = 0;

const promo = (remainingSeconds: number): PaywallPromo => ({
  remainingSeconds,
  expiresAt,
  newUser: true,
});

beforeEach(() => {
  serial += 1;
  expiresAt = `2026-09-22T14:35:${String(serial).padStart(2, '0')}`;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('usePromoOffer', () => {
  it('할인이 없으면 남은 시간도 없다', () => {
    const { result } = renderHook(() => usePromoOffer(null));

    expect(result.current).toBeNull();
  });

  it('1초마다 남은 시간이 줄어든다', () => {
    const { result } = renderHook(() => usePromoOffer(promo(300)));

    expect(result.current?.remainingSeconds).toBe(300);
    act(() => void vi.advanceTimersByTime(3000));

    expect(result.current?.remainingSeconds).toBe(297);
  });

  it('남은 시간이 0이 되면 끝난다 — 화면은 이걸 보고 시트와 배지를 거둔다', () => {
    const { result } = renderHook(() => usePromoOffer(promo(2)));

    act(() => void vi.advanceTimersByTime(2000));

    expect(result.current).toBeNull();
  });

  it('화면을 떠났다 돌아오면 흘러간 시간만큼 줄어 있다 — 웹뷰가 멈춰 타이머를 놓쳐도 맞는다', () => {
    const { result } = renderHook(() => usePromoOffer(promo(300)));

    act(() => {
      vi.setSystemTime(Date.now() + 100_000);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current?.remainingSeconds).toBe(200);
  });

  it('같은 만료 시각이면 다시 받아도 5분이 늘어나지 않는다 — 화면을 오가며 마운트될 때', () => {
    const { result, rerender } = renderHook(
      ({ next }: { next: PaywallPromo | null }) => usePromoOffer(next),
      { initialProps: { next: promo(300) } },
    );

    act(() => void vi.advanceTimersByTime(5000));
    // 서버가 같은 할인을 다시 줬다 — 만료 시각이 같으므로 이어서 센다
    rerender({ next: promo(300) });

    expect(result.current?.remainingSeconds).toBe(295);
  });

  it('화면을 떠나 마운트가 끊겼다 돌아와도 5분이 다시 시작되지 않는다', () => {
    const first = renderHook(() => usePromoOffer(promo(300)));
    act(() => void vi.advanceTimersByTime(60_000));
    first.unmount();

    // 구독 캐시에는 받았을 때의 300초가 그대로 담겨 있다
    const { result } = renderHook(() => usePromoOffer(promo(300)));

    expect(result.current?.remainingSeconds).toBe(240);
  });

  it('만료 시각이 바뀌면 그 값으로 다시 잰다 — 다른 할인이다', () => {
    const { result, rerender } = renderHook(
      ({ next }: { next: PaywallPromo | null }) => usePromoOffer(next),
      { initialProps: { next: promo(300) } },
    );

    act(() => void vi.advanceTimersByTime(5000));
    rerender({
      next: { ...promo(120), expiresAt: '2026-09-22T15:00:00' },
    });

    expect(result.current?.remainingSeconds).toBe(120);
  });

  it('할인의 나머지 정보를 그대로 들고 있다 — 시트가 라벨과 계측에 쓴다', () => {
    const { result } = renderHook(() => usePromoOffer(promo(300)));

    expect(result.current).toMatchObject({
      newUser: true,
    });
  });
});
