'use client';

// 소셜 로그인 콜백 — 제공자가 돌려준 code를 id_token으로 교환하고 백엔드 로그인까지 마친 뒤 라우팅한다
import { use, useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { socialLogin } from '@/shared/api/auth/social-login';
import { hasSeenOnboarding } from '@/shared/auth/onboarding-seen';
import {
  clearPendingSocialLogin,
  readPendingSocialLogin,
  type WebSocialProvider,
} from '@/shared/auth/web-social-login';
import { useAuthStore } from '@/shared/store/auth-store';

const WEB_PROVIDERS: WebSocialProvider[] = ['kakao', 'google'];
const isWebProvider = (value: string): value is WebSocialProvider =>
  (WEB_PROVIDERS as string[]).includes(value);

export default function SocialLoginCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string }>;
  searchParams: Promise<{ code?: string; state?: string; error?: string }>;
}) {
  const { provider } = use(params);
  const { code, state, error } = use(searchParams);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // authorization code는 1회용이라 개발 모드 이펙트 2회 실행에도 교환은 한 번만 나가게 막는다
    if (started.current) return;
    started.current = true;

    const run = async () => {
      if (!isWebProvider(provider)) {
        setMessage('지원하지 않는 로그인 제공자예요.');
        return;
      }

      if (error) {
        // 동의 화면에서 사용자가 취소한 경우엔 조용히 로그인 화면으로 되돌린다
        if (error === 'access_denied' || error === 'user_cancelled_authorize') {
          track(EVENTS.LOGIN_CANCELED, { provider });
          clearPendingSocialLogin();
          router.replace('/login');
          return;
        }
        track(EVENTS.LOGIN_FAILED, {
          provider,
          method: 'web',
          reason: 'provider_error',
        });
        setMessage('소셜 로그인이 취소됐어요.');
        return;
      }

      const pending = readPendingSocialLogin();
      if (!code || !state || !pending) {
        track(EVENTS.LOGIN_FAILED, {
          provider,
          method: 'web',
          reason: 'missing_request',
        });
        setMessage('로그인 요청 정보를 찾지 못했어요. 다시 시도해 주세요.');
        return;
      }
      // CSRF 방어 — 시작할 때 저장한 provider·state와 일치해야 한다
      if (pending.provider !== provider || pending.state !== state) {
        track(EVENTS.LOGIN_FAILED, {
          provider,
          method: 'web',
          reason: 'state_mismatch',
        });
        setMessage('로그인 검증 값이 일치하지 않아요. 다시 시도해 주세요.');
        return;
      }

      try {
        const tokenRes = await fetch('/auth/oauth-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            code,
            redirectUri: pending.redirectUri,
            codeVerifier: pending.codeVerifier,
          }),
        });
        const tokenJson = (await tokenRes.json()) as {
          idToken?: string;
          error?: string;
        };
        if (!tokenRes.ok || !tokenJson.idToken) {
          track(EVENTS.LOGIN_FAILED, {
            provider,
            method: 'web',
            reason: 'token_exchange_failed',
          });
          setMessage(tokenJson.error ?? '소셜 로그인 토큰 교환에 실패했어요.');
          return;
        }

        const { accessToken, refreshToken, user } = await socialLogin(
          provider,
          tokenJson.idToken,
          pending.nonce,
        );
        clearPendingSocialLogin();
        // newUser는 로그인 시점 분기용이라 전역 상태에는 빼고 저장한다
        const { newUser, ...member } = user;
        setAuth(accessToken, refreshToken, member);
        track(EVENTS.LOGIN_COMPLETED, {
          provider,
          method: 'web',
          is_new_user: newUser,
        });
        router.replace(
          newUser || !hasSeenOnboarding() ? '/onboarding' : '/home',
        );
      } catch (err) {
        track(EVENTS.LOGIN_FAILED, {
          provider,
          method: 'web',
          reason: 'login_api_failed',
        });
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) console.error('[auth] 웹 소셜 로그인 실패:', err);
        const detail = isDev && err instanceof Error ? ` (${err.message})` : '';
        setMessage(`로그인에 실패했어요. 다시 시도해 주세요.${detail}`);
      }
    };

    run();
  }, [provider, code, state, error, router, setAuth]);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      {message ? (
        <>
          <p className="text-sm font-medium text-destructive">{message}</p>
          <button
            type="button"
            className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
            onClick={() => router.replace('/login')}
          >
            로그인으로 돌아가기
          </button>
        </>
      ) : (
        <p className="text-sm font-medium text-muted-foreground">
          로그인 중이에요…
        </p>
      )}
    </main>
  );
}
