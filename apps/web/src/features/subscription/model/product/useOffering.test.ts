// 오퍼링 조회 훅 — 셸에 묻는 동안만 대기 중이고, 답이 오거나 못 받고 끝나면 대기가 풀린다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOffering } from './useOffering';

const mocks = vi.hoisted(() => ({
  support: 'ready' as string,
  resolve: (() => {}) as (reply: unknown) => void,
}));

vi.mock('../../api/shell-purchases', () => ({
  resolvePurchaseSupport: () => mocks.support,
  fetchOfferingsViaBridge: () =>
    new Promise((resolve) => (mocks.resolve = resolve)),
}));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));

beforeEach(() => {
  mocks.support = 'ready';
});

describe('useOffering', () => {
  it('셸에 묻는 동안은 대기 중이고, 답이 오면 대기가 풀리고 오퍼링을 돌려준다', async () => {
    const { result } = renderHook(() => useOffering());

    expect(result.current.pending).toBe(true);
    await act(async () =>
      mocks.resolve({
        packages: [
          { id: '$rc_annual', plan: 'yearly', price: 94_500, currency: 'KRW' },
        ],
      }),
    );

    expect(result.current.pending).toBe(false);
    expect(result.current.regular.yearly?.price).toBe(94_500);
  });

  it('답을 못 받고 끝나면 대기가 풀리고 빈 오퍼링이다 — 화면은 등록값으로 돌아간다', async () => {
    const { result } = renderHook(() => useOffering());

    await act(async () => mocks.resolve(null));

    expect(result.current.pending).toBe(false);
    expect(result.current.regular).toEqual({});
  });

  it('셸이 답을 마쳐야 settled가 된다 — 묻는 동안은 아직 아니다', async () => {
    const { result } = renderHook(() => useOffering());

    expect(result.current.settled).toBe(false);
    await act(async () => mocks.resolve(null));

    expect(result.current.settled).toBe(true);
  });

  it('다시 물으면 셸에 한 번 더 묻고, 그동안 다시 대기한다', async () => {
    const { result } = renderHook(() => useOffering());
    await act(async () => mocks.resolve(null));

    act(() => result.current.retry());

    expect(result.current.pending).toBe(true);
    expect(result.current.settled).toBe(false);
    await act(async () =>
      mocks.resolve({
        packages: [
          { id: '$rc_annual', plan: 'yearly', price: 10_000, currency: 'JPY' },
        ],
      }),
    );
    expect(result.current.regular.yearly?.price).toBe(10_000);
  });

  it('결제할 수 없는 환경이면 묻지 않으므로 대기하지 않고 settled도 아니다', () => {
    mocks.support = 'unsupported';
    const { result } = renderHook(() => useOffering());

    expect(result.current.pending).toBe(false);
    expect(result.current.settled).toBe(false);
  });

  it('꺼 두면 묻지 않으므로 대기하지 않는다', () => {
    const { result } = renderHook(() => useOffering({ enabled: false }));

    expect(result.current.pending).toBe(false);
  });
});
