'use client';

// 로그인 버튼 → (네이티브면) 브릿지로 idToken 수신 후 /social-login, (브라우저면) 웹 OAuth로 폴백
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { socialLogin } from '@/shared/api/auth/social-login';
import { startWebSocialLogin } from '@/shared/auth/web-social-login';
import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';
import { generateRandomHex } from '@/shared/lib/crypto';
import { useAuthStore } from '@/shared/store/auth-store';

type SocialProvider = 'kakao' | 'google' | 'apple';

export function useSocialLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 네이티브가 idToken을 돌려주면(SUCCESS) 백엔드 로그인까지 이어서 처리한다
  useEffect(
    () =>
      subscribeFromNative(async (message) => {
        if (message.type === 'SOCIAL_LOGIN_ERROR') {
          // 사용자가 로그인 중 취소한 거면 에러로 보여주지 않고 조용히 로그인 화면으로 돌아간다
          if (message.cancelled) {
            track(EVENTS.LOGIN_CANCELED, {});
          } else {
            setError(message.message);
            track(EVENTS.LOGIN_FAILED, {
              method: 'native',
              reason: 'provider_error',
            });
          }
          setPending(null);
          return;
        }
        if (message.type !== 'SOCIAL_LOGIN_SUCCESS') return;

        try {
          const { accessToken, refreshToken, user } = await socialLogin(
            message.provider,
            message.idToken,
            message.nonce,
            message.nickname,
          );
          // newUser는 로그인 시점 분기용이라 전역 상태에는 빼고 저장한다
          const { newUser, ...member } = user;
          setAuth(accessToken, refreshToken, member);
          track(EVENTS.LOGIN_COMPLETED, {
            provider: message.provider,
            method: 'native',
            is_new_user: newUser,
          });
          // TODO: 온보딩 중도 이탈 유저는 재로그인 시 newUser=false라 다시 못 본다 — 서버 완료 플래그가 생기면 그걸로 분기
          router.replace(newUser ? '/onboarding' : '/home');
        } catch (error) {
          track(EVENTS.LOGIN_FAILED, {
            provider: message.provider,
            method: 'native',
            reason: 'login_api_failed',
          });
          // 개발 모드에선 서버가 준 실패 사유를 화면·콘솔에 그대로 노출한다 (프로덕션은 일반 문구만)
          const isDev = process.env.NODE_ENV === 'development';
          if (isDev) console.error('[auth] social-login 실패:', error);
          const detail =
            isDev && error instanceof Error ? ` (${error.message})` : '';
          setError(`로그인에 실패했어요. 다시 시도해 주세요.${detail}`);
          setPending(null);
        }
      }),
    [router, setAuth],
  );

  const login = async (provider: SocialProvider) => {
    setError(null);
    // 네이티브 셸(WebView) 안이면 네이티브 SDK로, 밖(일반 브라우저)이면 웹 OAuth로 진행한다
    if (postToNative({ type: 'SOCIAL_LOGIN_REQUEST', provider })) {
      track(EVENTS.LOGIN_STARTED, { provider, method: 'native' });
      setPending(provider);
      return;
    }

    // 애플 웹 로그인은 실도메인이 필요해 브라우저 단독에선 지원하지 않는다
    if (provider === 'apple') {
      setError('애플 로그인은 앱에서만 가능해요.');
      return;
    }

    track(EVENTS.LOGIN_STARTED, { provider, method: 'web' });
    setPending(provider);
    try {
      // 성공하면 제공자 인증 페이지로 이동하며 현재 페이지를 떠난다 (완료 처리는 콜백 페이지)
      await startWebSocialLogin(provider, generateRandomHex(16));
    } catch (err) {
      setPending(null);
      track(EVENTS.LOGIN_FAILED, {
        provider,
        method: 'web',
        reason: 'start_failed',
      });
      const isDev = process.env.NODE_ENV === 'development';
      const detail = isDev && err instanceof Error ? ` (${err.message})` : '';
      setError(`로그인을 시작하지 못했어요.${detail}`);
    }
  };

  return { login, pending, error };
}
