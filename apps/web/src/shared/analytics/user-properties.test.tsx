// 배선 통합 확인 — 실제 쿼리 훅·api 클라이언트·앰플리튜드 래퍼를 그대로 태우고
// 앱 부팅부터 응답 도착까지 앰플리튜드로 무엇이 나가는지 순서대로 본다 (SDK만 목)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfilePropertiesSync } from '@/features/onboarding/ui/ProfilePropertiesSync';
import { SubscriptionPropertiesSync } from '@/features/subscription/ui/SubscriptionPropertiesSync';
import { useAuthStore } from '@/shared/auth/auth-store';

import { AnalyticsBootstrap } from './AnalyticsBootstrap';

type IdentifyCall = ['set', string, unknown] | ['unset', string];

const amplitudeMock = vi.hoisted(() => {
  const calls: IdentifyCall[] = [];
  const events: Array<[string, unknown]> = [];
  return {
    calls,
    events,
    initAll: vi.fn(),
    track: vi.fn((event: string, props: unknown) => {
      events.push([event, props]);
    }),
    identify: vi.fn(),
    setUserId: vi.fn(),
    reset: vi.fn(),
    Identify: class {
      set(key: string, value: unknown) {
        calls.push(['set', key, value]);
        return this;
      }
      unset(key: string) {
        calls.push(['unset', key]);
        return this;
      }
    },
  };
});
vi.mock('@amplitude/unified', () => amplitudeMock);

// 이 판에서 500으로 답할 엔드포인트 — 조회 실패 구간을 흉내 낸다
const failingPaths = new Set<string>();

// 백엔드 공통 봉투 { success, data }로 답하는 가짜 서버 — 느린 구독 응답까지 흉내 낸다
const respond = (data: unknown, delayMs = 0) =>
  new Promise<Response>((resolve) =>
    setTimeout(
      () =>
        resolve(
          new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      delayMs,
    ),
  );

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_AMPLITUDE_API_KEY', 'test-key');
  amplitudeMock.calls.length = 0;
  amplitudeMock.events.length = 0;

  failingPaths.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn((path: string) => {
      if ([...failingPaths].some((failing) => path.includes(failing))) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: false }), { status: 500 }),
        );
      }
      if (path.includes('/me/subscription')) {
        return respond(
          {
            premium: true,
            subscriptionStatus: 'ACTIVE',
            periodType: 'TRIAL',
            expiresAt: '2026-10-04T12:00:00',
            productId: 'com.saynow.app.premium.yearly',
          },
          20,
        );
      }
      if (path.includes('/me/learning-level'))
        return respond({ learningLevel: 3 });
      if (path.includes('/me/accent-locale')) {
        return respond({ accentLocale: 'EN_GB', name: '영국' });
      }
      return respond(null);
    }),
  );

  useAuthStore.setState({
    accessToken: 'access',
    refreshToken: 'refresh',
    member: { userId: 42, nickname: null, email: null, provider: 'KAKAO' },
  });
});

afterEach(() => {
  // 수동 cleanup — globals 미설정이라 자동 언마운트가 없다. 남겨두면 다음 판에서 옛 트리가 다시 발화한다
  cleanup();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    member: null,
  });
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const bootApp = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AnalyticsBootstrap />
      <SubscriptionPropertiesSync />
      <ProfilePropertiesSync />
    </QueryClientProvider>,
  );
};

describe('유저 속성 배선', () => {
  it('앱을 켜면 식별 → 모름 → 실제 값 순서로 프로필이 채워진다', async () => {
    bootApp();

    // ① 로그인 식별이 먼저
    await waitFor(() =>
      expect(amplitudeMock.setUserId).toHaveBeenCalledWith('42'),
    );
    expect(amplitudeMock.calls).toContainEqual(['set', 'provider', 'kakao']);

    // ② 구독 응답 전에는 모름으로 두고 지난 값을 지운다
    await waitFor(() =>
      expect(amplitudeMock.calls).toContainEqual([
        'set',
        'subscription_state',
        'unknown',
      ]),
    );
    expect(amplitudeMock.calls).toContainEqual(['unset', 'is_premium']);
    expect(amplitudeMock.calls).toContainEqual(['unset', 'plan']);

    // ③ 응답이 도착하면 실제 값으로 덮인다
    await waitFor(() =>
      expect(amplitudeMock.calls).toContainEqual(['set', 'is_premium', true]),
    );
    expect(amplitudeMock.calls).toContainEqual([
      'set',
      'subscription_state',
      'trial',
    ]);
    expect(amplitudeMock.calls).toContainEqual(['set', 'plan', 'yearly']);

    // ④ 수준·배울 영어도 같이 올라간다
    await waitFor(() =>
      expect(amplitudeMock.calls).toContainEqual(['set', 'learning_level', 3]),
    );
    expect(amplitudeMock.calls).toContainEqual([
      'set',
      'accent_locale',
      'EN_GB',
    ]);

    // 마지막에 남은 값이 실제 구독 상태다 — 모름이 나중에 덮어쓰지 않는다
    const lastState = amplitudeMock.calls
      .filter(([kind, key]) => kind === 'set' && key === 'subscription_state')
      .at(-1);
    expect(lastState).toEqual(['set', 'subscription_state', 'trial']);
  });

  it('배울 영어 조회가 실패해도 학습 수준은 올라간다', async () => {
    failingPaths.add('/me/accent-locale');
    bootApp();

    await waitFor(() =>
      expect(amplitudeMock.calls).toContainEqual(['set', 'learning_level', 3]),
    );
    expect(amplitudeMock.calls.some(([, key]) => key === 'accent_locale')).toBe(
      false,
    );
  });

  it('로그아웃하면 프로필을 통째로 비운다', async () => {
    bootApp();
    await waitFor(() =>
      expect(amplitudeMock.setUserId).toHaveBeenCalledWith('42'),
    );

    useAuthStore.getState().clearAuth();

    await waitFor(() => expect(amplitudeMock.reset).toHaveBeenCalled());
  });
});
