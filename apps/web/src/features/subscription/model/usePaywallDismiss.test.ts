// 페이월 닫기 — 서버에 알리고 받은 할인을 홈으로 넘긴다. 늦게 온 할인은 같은 계정일 때만 받는다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Offering } from './offering';
import { usePaywallDismiss } from './usePaywallDismiss';

const mocks = vi.hoisted(() => ({
  state: { member: { userId: 1 } as { userId: number } | null },
  dismiss: vi.fn(),
  setQueryData: vi.fn(),
  handOffPromo: vi.fn(),
}));

vi.mock('@/shared/auth/auth-store', () => {
  const useAuthStore = (selector: (s: unknown) => unknown) =>
    selector(mocks.state);
  useAuthStore.getState = () => mocks.state;
  return { useAuthStore };
});
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ setQueryData: mocks.setQueryData }),
}));
vi.mock('../api/subscription', () => ({
  dismissPaywall: () => mocks.dismiss(),
}));
vi.mock('./payment-flag', () => ({ PROMO_ENABLED: true }));
vi.mock('./promo-handoff', () => ({ handOffPromo: mocks.handOffPromo }));

const offering: Offering = {
  regular: {
    monthly: { packageId: '$rc_monthly', price: 14_900, currency: 'KRW' },
    yearly: { packageId: '$rc_annual', price: 94_500, currency: 'KRW' },
  },
  promo: {
    yearly: { packageId: 'annual_discount', price: 58_500, currency: 'KRW' },
  },
};

const promo = {
  remainingSeconds: 300,
  expiresAt: '2026-09-22T14:35:00',
  newUser: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state = { member: { userId: 1 } };
  mocks.dismiss = vi.fn().mockResolvedValue({ promo: null });
});
afterEach(() => vi.useRealTimers());

describe('usePaywallDismiss', () => {
  it('할인을 받으면 구독 캐시에 얹고 홈으로 넘긴다', async () => {
    mocks.dismiss = vi.fn().mockResolvedValue({ promo });
    const { result } = renderHook(() => usePaywallDismiss(offering));

    await act(() => result.current());

    expect(mocks.setQueryData).toHaveBeenCalled();
    expect(mocks.handOffPromo).toHaveBeenCalledWith(promo);
  });

  it('할인을 보여줄 수 없으면 서버에 알리지 않는다 — 못 보여줄 할인에 5분을 태우지 않는다', async () => {
    const { result } = renderHook(() =>
      usePaywallDismiss({ ...offering, promo: {} }),
    );

    await act(() => result.current());

    expect(mocks.dismiss).not.toHaveBeenCalled();
  });

  it('할인율이 0이면 알리지 않는다 — 정가 인상 전에 오퍼링에 먼저 넣어 둬도 5분이 타지 않는다', async () => {
    const { result } = renderHook(() =>
      usePaywallDismiss({
        ...offering,
        regular: {
          ...offering.regular,
          yearly: { packageId: '$rc_annual', price: 58_500, currency: 'KRW' },
        },
      }),
    );

    await act(() => result.current());

    expect(mocks.dismiss).not.toHaveBeenCalled();
  });

  it('서버가 늦으면 3초만 기다리고 끝낸 뒤, 늦게 온 할인도 받아 넘긴다', async () => {
    vi.useFakeTimers();
    let respond = (_: unknown) => {};
    mocks.dismiss = vi.fn(() => new Promise((resolve) => (respond = resolve)));
    const { result } = renderHook(() => usePaywallDismiss(offering));

    const done = result.current();
    await act(() => vi.advanceTimersByTimeAsync(3000));
    await done;
    expect(mocks.handOffPromo).not.toHaveBeenCalled();

    await act(async () => respond({ promo }));
    expect(mocks.handOffPromo).toHaveBeenCalledWith(promo);
  });

  it('늦게 온 할인은 그사이 계정이 바뀌었으면 버린다 — 앞 사람의 할인이 다음 사람에게 뜨지 않게', async () => {
    vi.useFakeTimers();
    let respond = (_: unknown) => {};
    mocks.dismiss = vi.fn(() => new Promise((resolve) => (respond = resolve)));
    const { result } = renderHook(() => usePaywallDismiss(offering));

    const done = result.current();
    await act(() => vi.advanceTimersByTimeAsync(3000));
    await done;

    mocks.state = { member: { userId: 2 } };
    await act(async () => respond({ promo }));

    expect(mocks.setQueryData).not.toHaveBeenCalled();
    expect(mocks.handOffPromo).not.toHaveBeenCalled();
  });

  it('기록이 실패해도 에러 없이 끝난다 — 닫히는 것을 막지 않는다', async () => {
    mocks.dismiss = vi.fn().mockRejectedValue(new Error('네트워크'));
    const { result } = renderHook(() => usePaywallDismiss(offering));

    await expect(act(() => result.current())).resolves.not.toThrow();
    expect(mocks.handOffPromo).not.toHaveBeenCalled();
  });
});
