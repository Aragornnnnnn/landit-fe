// 결제 지휘 훅의 갈림길 — 환경 차단, 취소·실패·성공, 서버 반영 대기, 복원 결과, 화면이 사라진 뒤의 회신
import { createElement, StrictMode, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlanPricingMap } from './offerings';
import { usePurchase } from './usePurchase';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  showToast: vi.fn(),
  getNativeContext: vi.fn(),
  purchaseViaBridge: vi.fn(),
  restoreViaBridge: vi.fn(),
  getMySubscription: vi.fn(),
}));

// zustand 훅은 자기 밑 react 복사본을 잡아 렌더러와 어긋난다 — 선택자만 흉내 낸다 (useSatisfactionSheet.test 선례)
vi.mock('@/shared/auth/auth-store', () => {
  const state = { member: { userId: 42 } };
  const useAuthStore = (selector: (s: unknown) => unknown) => selector(state);
  // 확인 뒤 계정이 바뀌었는지 볼 때 getState로 읽는다
  useAuthStore.getState = () => state;
  return { useAuthStore };
});
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/ui/toast', () => ({ showToast: mocks.showToast }));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: mocks.getNativeContext,
}));
// 환경 판정은 진짜를 쓰고 셸 왕복만 대역으로
vi.mock('./shell-purchases', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./shell-purchases')>();
  return {
    ...actual,
    purchaseViaBridge: mocks.purchaseViaBridge,
    restoreViaBridge: mocks.restoreViaBridge,
  };
});
vi.mock('../api/subscription', () => ({
  getMySubscription: mocks.getMySubscription,
}));
// 서버 반영 대기는 실제 시간을 쓰지 않게 간격 0으로
vi.mock('./wait-for-premium', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./wait-for-premium')>();
  return { ...actual, PREMIUM_WAIT: { attempts: 2, intervalMs: 0 } };
});

const readyShell = {
  platform: 'ios',
  appVersion: '1.3.0',
  buildNumber: '6',
  bridgeVersion: 5,
};
const premium = { premium: true, subscriptionStatus: 'ACTIVE' };
const free = { premium: false, subscriptionStatus: 'NONE' };

// JSX 대신 createElement — 이 레포 테스트의 react 복사본 정렬 방식(useSatisfactionSheet.test 참고)
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children);

// StrictMode는 dev에서 effect를 마운트→정리→마운트로 두 번 돌린다 — 끊기 컨트롤러가 이걸 견뎌야 한다
const strictWrapper = ({ children }: { children: ReactNode }) =>
  createElement(StrictMode, null, wrapper({ children }));

const renderPurchase = (pricing: PlanPricingMap = {}, strict = false) => {
  const onUnlocked = vi.fn();
  const hook = renderHook(() => usePurchase({ pricing, onUnlocked }), {
    wrapper: strict ? strictWrapper : wrapper,
  });
  return { ...hook, onUnlocked };
};

beforeEach(() => {
  mocks.getNativeContext.mockReturnValue(readyShell);
  mocks.getMySubscription.mockResolvedValue(premium);
});

describe('usePurchase — 결제', () => {
  it('브라우저에서는 셸에 결제를 요청하지 않고 앱 안내만 한다', async () => {
    mocks.getNativeContext.mockReturnValue(null);
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly'));

    expect(mocks.purchaseViaBridge).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith(
      '결제는 랜딧 앱에서 할 수 있어요',
    );
    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      plan: 'yearly',
      reason: 'browser',
    });
  });

  it('결제 메시지를 모르는 구버전 셸이면 업데이트 안내를 한다', async () => {
    mocks.getNativeContext.mockReturnValue({ ...readyShell, bridgeVersion: 4 });
    const { result } = renderPurchase();

    await act(() => result.current.purchase('monthly'));

    expect(mocks.purchaseViaBridge).not.toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      plan: 'monthly',
      reason: 'outdated_shell',
    });
  });

  it('가격표에 있는 패키지로 결제하고, 없으면 표준 identifier로 결제한다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    const { result } = renderPurchase({
      yearly: { packageId: '$rc_annual_kr', price: 49_900, currency: 'KRW' },
    });

    await act(() => result.current.purchase('yearly'));
    await act(() => result.current.purchase('monthly'));

    expect(mocks.purchaseViaBridge).toHaveBeenNthCalledWith(
      1,
      '$rc_annual_kr',
      expect.any(AbortSignal),
    );
    expect(mocks.purchaseViaBridge).toHaveBeenNthCalledWith(
      2,
      '$rc_monthly',
      expect.any(AbortSignal),
    );
  });

  it('사용자가 시트를 닫으면 조용히 원래대로 돌아간다 — 토스트 없이 취소만 남긴다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'cancelled',
    });
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.purchase('yearly'));

    expect(result.current.busy).toBe(false);
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith('Purchase Canceled', {
      plan: 'yearly',
    });
  });

  it('셸이 실패를 회신하면 그 사유를 토스트로 보여주고 계측에는 문구를 따로 남긴다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'error',
      message: '지금은 살 수 없는 상품이에요.',
    });
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly'));

    expect(mocks.showToast).toHaveBeenCalledWith(
      '지금은 살 수 없는 상품이에요.',
    );
    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      plan: 'yearly',
      reason: 'shell_error',
      message: '지금은 살 수 없는 상품이에요.',
    });
  });

  it('회신이 없으면(제한 시간) 실패로 안내한다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue(null);
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly'));

    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      plan: 'yearly',
      reason: 'no_response',
    });
  });

  it('결제가 성공하고 서버가 유료로 바뀌면 완료를 남기고 다음 화면으로 넘긴다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.purchase('yearly'));

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(mocks.track).toHaveBeenCalledWith('Purchase Completed', {
      plan: 'yearly',
      unlocked: true,
    });
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('결제는 성공했는데 서버 반영이 늦으면 안내하고도 다음 화면으로 넘긴다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    mocks.getMySubscription.mockResolvedValue(free);
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.purchase('monthly'));

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(mocks.track).toHaveBeenCalledWith('Purchase Completed', {
      plan: 'monthly',
      unlocked: false,
    });
    expect(mocks.showToast).toHaveBeenCalledWith(
      '결제가 확인되는 중이에요. 잠시 후 다시 열어 주세요',
    );
  });

  it('dev StrictMode처럼 effect가 다시 실행돼도 결제 요청은 그대로 나간다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    const { result, onUnlocked } = renderPurchase({}, true);

    await act(() => result.current.purchase('yearly'));

    expect(mocks.purchaseViaBridge).toHaveBeenCalledTimes(1);
    const signal = mocks.purchaseViaBridge.mock.calls[0][1] as AbortSignal;
    expect(signal.aborted).toBe(false);
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
  });

  it('화면이 사라진 뒤 도착한 회신은 아무 일도 하지 않는다', async () => {
    let reply: (value: unknown) => void = () => {};
    mocks.purchaseViaBridge.mockReturnValue(
      new Promise((resolve) => {
        reply = resolve;
      }),
    );
    const { result, unmount, onUnlocked } = renderPurchase();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.purchase('yearly');
    });
    unmount();
    reply({ type: 'PURCHASE_RESULT', status: 'success' });
    await pending;

    expect(mocks.getMySubscription).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(onUnlocked).not.toHaveBeenCalled();
  });
});

describe('usePurchase — 서버 확인 중 화면을 떠남', () => {
  it('확인이 끝나기 전에 화면이 사라지면 안내와 이동을 하지 않는다 — 캐시 반영만 남는다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    let answer: (value: unknown) => void = () => {};
    mocks.getMySubscription.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const { result, unmount, onUnlocked } = renderPurchase();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.purchase('yearly');
    });
    await waitFor(() => expect(mocks.getMySubscription).toHaveBeenCalled());
    unmount();
    answer(free);
    await pending;

    expect(mocks.track).toHaveBeenCalledWith('Purchase Completed', {
      plan: 'yearly',
      unlocked: false,
    });
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(onUnlocked).not.toHaveBeenCalled();
  });
});

describe('usePurchase — 복원', () => {
  it('브라우저에서는 복원도 막고 플랜 없이 사유만 남긴다', async () => {
    mocks.getNativeContext.mockReturnValue(null);
    const { result } = renderPurchase();

    await act(() => result.current.restore());

    expect(mocks.restoreViaBridge).not.toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      reason: 'browser',
    });
  });

  it('복원이 되고 서버가 유료면 다음 화면으로 넘긴다', async () => {
    mocks.restoreViaBridge.mockResolvedValue({
      type: 'RESTORE_RESULT',
      status: 'success',
    });
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.restore());

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(mocks.track).toHaveBeenCalledWith('Purchase Restored', {
      succeeded: true,
    });
  });

  it('복원은 됐지만 살 만한 내역이 없으면 그렇게 알린다', async () => {
    mocks.restoreViaBridge.mockResolvedValue({
      type: 'RESTORE_RESULT',
      status: 'success',
    });
    mocks.getMySubscription.mockResolvedValue(free);
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.restore());

    expect(onUnlocked).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith('복원할 구매 내역이 없어요');
  });

  it('복원 자체가 실패하면 사유를 보여준다', async () => {
    mocks.restoreViaBridge.mockResolvedValue({
      type: 'RESTORE_RESULT',
      status: 'error',
      message: 'network',
    });
    const { result } = renderPurchase();

    await act(() => result.current.restore());

    expect(mocks.showToast).toHaveBeenCalledWith('network');
    expect(mocks.track).toHaveBeenCalledWith('Purchase Restored', {
      succeeded: false,
    });
  });
});
