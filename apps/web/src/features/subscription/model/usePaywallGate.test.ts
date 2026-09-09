// 게이트 훅의 갈림길 — 잠기면 페이월로 보내며 계측하고, 열리거나 재료가 없으면 원래 이동을 그대로 한다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePaywallGate } from './usePaywallGate';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  track: vi.fn(),
  getNativeContext: vi.fn(),
  subscription: { subscription: null as unknown, isError: false },
  subscriptionOptions: null as { enabled?: boolean } | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
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
  mocks.subscription = {
    subscription: { premium: false, conversationCompletedSinceLaunch: true },
    isError: false,
  };
});

describe('usePaywallGate', () => {
  it('무료 구간을 다 쓴 무료 사용자는 원래 이동 대신 페이월로 가고, 어느 문이었는지 남긴다', () => {
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'scenario', returnTo: '/scenario' });

    expect(go).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/paywall?from=%2Fscenario');
    expect(mocks.track).toHaveBeenCalledWith('Paywall Gate Locked', {
      entry: 'scenario',
    });
  });

  it('유료 사용자는 그대로 들어간다', () => {
    mocks.subscription = {
      subscription: { premium: true, conversationCompletedSinceLaunch: true },
      isError: false,
    };
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

  it('BE가 무료 구간 값을 아직 안 주면 막지 않고 들여보낸다 — 다음 진입에서 잡힌다', () => {
    mocks.subscription = { subscription: { premium: false }, isError: false };
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'scenario' });

    expect(go).toHaveBeenCalledTimes(1);
  });

  it('대화가 방금 끝났다고 알려 주면 서버 값이 아직 안 따라왔어도 잠근다 — 대화 직후 화면에서 바로 페이월로', () => {
    mocks.subscription = {
      subscription: { premium: false, conversationCompletedSinceLaunch: false },
      isError: false,
    };
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, {
      entry: 'conversation_finished',
      returnTo: '/conversation/scenario/7/expressions',
      conversationJustFinished: true,
    });

    expect(go).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith(
      '/paywall?from=%2Fconversation%2Fscenario%2F7%2Fexpressions',
    );
  });

  it('브라우저에서는 잠그지 않고, 구독도 묻지 않는다 — 어차피 열린다', () => {
    mocks.getNativeContext.mockReturnValue(null);
    const { result } = renderGate();
    const go = vi.fn();

    result.current.guard(go, { entry: 'scenario' });

    expect(go).toHaveBeenCalledTimes(1);
    expect(mocks.subscriptionOptions?.enabled).toBe(false);
  });

  it('결제를 아는 셸에서는 구독을 묻는다', () => {
    renderGate();

    expect(mocks.subscriptionOptions?.enabled).toBe(true);
  });
});
