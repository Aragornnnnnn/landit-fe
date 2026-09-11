// 결제가 열린 환경 판정 — 플래그와 셸 버전을 같이 본다. 페이월이 걸리는 환경과 같은 기준이다
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePaymentLive } from './usePaymentLive';

const mocks = vi.hoisted(() => ({
  getNativeContext: vi.fn(),
  paymentEnabled: true,
}));

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
}));
vi.mock('./payment-flag', () => ({
  get PAYMENT_ENABLED() {
    return mocks.paymentEnabled;
  },
}));

const shell = (appVersion: string) => ({
  platform: 'ios',
  appVersion,
  buildNumber: '6',
  bridgeVersion: 5,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.paymentEnabled = true;
  mocks.getNativeContext.mockReturnValue(shell('1.3.0'));
});

describe('usePaymentLive', () => {
  it('플래그가 켜져 있고 결제 브릿지가 실린 셸(1.3.0 이상)이면 결제가 열린 환경이다', () => {
    const { result } = renderHook(() => usePaymentLive());

    expect(result.current).toBe(true);
  });

  it('플래그가 꺼져 있으면 셸 버전과 무관하게 열리지 않는다', () => {
    mocks.paymentEnabled = false;

    const { result } = renderHook(() => usePaymentLive());

    expect(result.current).toBe(false);
  });

  it('브라우저(셸 컨텍스트 없음)에서는 열리지 않는다', () => {
    mocks.getNativeContext.mockReturnValue(null);

    const { result } = renderHook(() => usePaymentLive());

    expect(result.current).toBe(false);
  });

  it('결제 브릿지가 없는 구버전 셸에서는 열리지 않는다', () => {
    mocks.getNativeContext.mockReturnValue(shell('1.2.9'));

    const { result } = renderHook(() => usePaymentLive());

    expect(result.current).toBe(false);
  });
});
