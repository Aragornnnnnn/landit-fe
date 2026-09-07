// 결제 지휘 훅의 갈림길 — 환경 차단, 취소·실패·성공, 서버 반영 대기, 복원 결과
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePurchase } from './usePurchase';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  showToast: vi.fn(),
  getNativeContext: vi.fn(),
  purchaseViaBridge: vi.fn(),
  restoreViaBridge: vi.fn(),
  identifyViaBridge: vi.fn(),
  getMySubscription: vi.fn(),
}));

// zustand 훅은 자기 밑 react 복사본을 잡아 렌더러와 어긋난다 — 선택자만 흉내 낸다 (useSatisfactionSheet.test 선례)
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/ui/toast', () => ({ showToast: mocks.showToast }));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: mocks.getNativeContext,
}));
vi.mock('./purchase-flow', () => ({
  purchaseViaBridge: mocks.purchaseViaBridge,
  restoreViaBridge: mocks.restoreViaBridge,
  identifyViaBridge: mocks.identifyViaBridge,
}));
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

// JSX 대신 createElement — 이 레포 테스트의 react 복사본 정렬 방식(useSatisfactionSheet.test 참고)
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children);

const renderPurchase = () => {
  const onUnlocked = vi.fn();
  const hook = renderHook(() => usePurchase({ onUnlocked }), { wrapper });
  return { ...hook, onUnlocked };
};

beforeEach(() => {
  mocks.getNativeContext.mockReturnValue(readyShell);
  mocks.getMySubscription.mockResolvedValue({ premium: true });
});

describe('usePurchase — 결제', () => {
  it('브라우저에서는 셸에 결제를 요청하지 않고 앱 안내만 한다', async () => {
    mocks.getNativeContext.mockReturnValue(null);
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly', '$rc_annual'));

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

    await act(() => result.current.purchase('monthly', '$rc_monthly'));

    expect(mocks.purchaseViaBridge).not.toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      plan: 'monthly',
      reason: 'outdated_shell',
    });
  });

  it('결제 직전에 로그인 사용자를 셸에 다시 알리고 패키지 id로 결제를 요청한다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly', '$rc_annual'));

    expect(mocks.identifyViaBridge).toHaveBeenCalledWith(
      expect.anything(),
      '42',
    );
    expect(mocks.purchaseViaBridge).toHaveBeenCalledWith(
      expect.anything(),
      '$rc_annual',
    );
  });

  it('사용자가 시트를 닫으면 조용히 원래대로 돌아간다 — 토스트 없이 취소만 남긴다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'cancelled',
    });
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.purchase('yearly', '$rc_annual'));

    expect(result.current.phase).toBe('idle');
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(onUnlocked).not.toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith('Purchase Canceled', {
      plan: 'yearly',
    });
  });

  it('셸이 실패를 회신하면 그 사유를 토스트로 보여준다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue({
      type: 'PURCHASE_RESULT',
      status: 'error',
      message: '지금은 살 수 없는 상품이에요.',
    });
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly', '$rc_annual'));

    expect(mocks.showToast).toHaveBeenCalledWith(
      '지금은 살 수 없는 상품이에요.',
    );
    expect(mocks.track).toHaveBeenCalledWith('Purchase Failed', {
      plan: 'yearly',
      reason: '지금은 살 수 없는 상품이에요.',
    });
  });

  it('회신이 없으면(제한 시간) 실패로 안내한다', async () => {
    mocks.purchaseViaBridge.mockResolvedValue(null);
    const { result } = renderPurchase();

    await act(() => result.current.purchase('yearly', '$rc_annual'));

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

    await act(() => result.current.purchase('yearly', '$rc_annual'));

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
    mocks.getMySubscription.mockResolvedValue({ premium: false });
    const { result, onUnlocked } = renderPurchase();

    await act(() => result.current.purchase('monthly', '$rc_monthly'));

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
    expect(mocks.track).toHaveBeenCalledWith('Purchase Completed', {
      plan: 'monthly',
      unlocked: false,
    });
    expect(mocks.showToast).toHaveBeenCalledWith(
      '결제가 확인되는 중이에요. 잠시 후 다시 열어 주세요',
    );
  });
});

describe('usePurchase — 복원', () => {
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
    mocks.getMySubscription.mockResolvedValue({ premium: false });
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
