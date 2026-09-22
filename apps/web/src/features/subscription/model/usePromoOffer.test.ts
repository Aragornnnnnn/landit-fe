// 한시 할인 카운트다운 — 받은 순간을 기준으로 재고, 화면을 떠났다 돌아와도 맞아야 한다
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaywallPromo } from '@/features/subscription/api/subscription';

import { usePromoOffer } from './usePromoOffer';

const promo = (remainingSeconds: number): PaywallPromo => ({
  remainingSeconds,
  expiresAt: '2026-09-22T14:35:00',
  newUser: true,
});

beforeEach(() => vi.useFakeTimers());
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

  it('받은 값이 바뀌면 그 값으로 다시 잰다 — 시트를 다시 열어 새로 받았을 때', () => {
    const { result, rerender } = renderHook(
      ({ next }: { next: PaywallPromo | null }) => usePromoOffer(next),
      { initialProps: { next: promo(300) } },
    );

    act(() => void vi.advanceTimersByTime(5000));
    rerender({ next: promo(120) });

    expect(result.current?.remainingSeconds).toBe(120);
  });

  it('할인의 나머지 정보를 그대로 들고 있다 — 시트가 라벨과 계측에 쓴다', () => {
    const { result } = renderHook(() => usePromoOffer(promo(300)));

    expect(result.current).toMatchObject({
      newUser: true,
    });
  });
});
