// 게이트 훅의 갈림길 — 잠기면 페이월로 보내며 계측하고, 열리거나 재료가 없으면 원래 이동을 그대로 한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePaywallGate } from './usePaywallGate';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  track: vi.fn(),
  getNativeContext: vi.fn(),
  subscription: { subscription: null as unknown, isError: false },
  subscriptionOptions: null as { enabled?: boolean } | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
}));
vi.mock('./payment-flag', () => ({ PAYMENT_ENABLED: true }));
vi.mock('./useSubscriptionQuery', () => ({
  useSubscriptionQuery: (options: { enabled?: boolean }) => {
    mocks.subscriptionOptions = options;
    return mocks.subscription;
  },
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children);

const readyShell = {
  platform: 'ios',
  appVersion: '1.3.0',
  buildNumber: '6',
  bridgeVersion: 5,
};

const renderGate = () => renderHook(() => usePaywallGate(), { wrapper });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getNativeContext.mockReturnValue(readyShell);
  mocks.subscription = { subscription: { premium: false }, isError: false };
});

describe('usePaywallGate', () => {
  it('무료 사용자는 원래 이동 대신 페이월로 가고, 어느 문이었는지 남긴다', () => {
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'expression', returnTo: '/scenario' });

    expect(go).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/paywall?from=%2Fscenario');
    expect(mocks.track).toHaveBeenCalledWith('Paywall Gate Locked', {
      entry: 'expression',
    });
  });

  it('유료 사용자는 그대로 들어간다', () => {
    mocks.subscription = { subscription: { premium: true }, isError: false };
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'expression' });

    expect(go).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('구독 조회가 실패했으면 잠그지 않는다 — 구독 API가 아직 없어도 학습은 막히지 않아야 한다', () => {
    mocks.subscription = { subscription: null, isError: true };
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'smalltalk' });

    expect(go).toHaveBeenCalledTimes(1);
  });

  it('구독을 아직 못 받았으면 막지 않고 들여보낸다 — 다음 진입에서 잡힌다', () => {
    mocks.subscription = { subscription: null, isError: false };
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'smalltalk' });

    expect(go).toHaveBeenCalledTimes(1);
    expect(result.current.locked).toBe(false);
  });

  it('학습 문이 잠기는지를 미리 알려준다 — 무료면 참, 유료면 거짓', () => {
    expect(renderGate().result.current.locked).toBe(true);

    mocks.subscription = { subscription: { premium: true }, isError: false };
    expect(renderGate().result.current.locked).toBe(false);
  });

  it('히스토리에서 지우라고 하면 페이월로 replace한다 — 뒤로가기로 끝난 화면에 되돌아가지 않게', () => {
    const { result } = renderGate();

    result.current.guard(vi.fn(), {
      entry: 'conversation_finished',
      returnTo: '/expressions/scenario/7/branch',
      replace: true,
    });

    expect(mocks.replace).toHaveBeenCalledWith(
      '/paywall?from=%2Fexpressions%2Fscenario%2F7%2Fbranch',
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('브라우저에서는 잠그지 않고, 구독도 묻지 않는다 — 어차피 열린다', () => {
    mocks.getNativeContext.mockReturnValue(null);
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'expression' });

    expect(go).toHaveBeenCalledTimes(1);
    expect(result.current.locked).toBe(false);
    expect(mocks.subscriptionOptions?.enabled).toBe(false);
  });

  it('결제를 아는 셸에서는 구독을 묻는다', () => {
    renderGate();

    expect(mocks.subscriptionOptions?.enabled).toBe(true);
  });
});
