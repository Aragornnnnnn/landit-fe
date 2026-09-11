// 스몰톡 하루 말하기 한도 — 결제가 열린 환경에서는 한도 없이 말한다
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSpeakingLimit } from './useSpeakingLimit';

const mocks = vi.hoisted(() => ({ paymentLive: false }));

vi.mock('@/features/subscription/model/usePaymentLive', () => ({
  usePaymentLive: () => mocks.paymentLive,
}));

describe('useSpeakingLimit', () => {
  it('결제가 열린 환경이면 무제한이다', () => {
    mocks.paymentLive = true;

    const { result } = renderHook(() => useSpeakingLimit());

    expect(result.current.unlimited).toBe(true);
  });

  it('결제가 열리기 전(플래그 꺼짐·브라우저·구버전 셸)에는 하루 한도가 그대로다', () => {
    mocks.paymentLive = false;

    const { result } = renderHook(() => useSpeakingLimit());

    expect(result.current.unlimited).toBe(false);
  });
});
