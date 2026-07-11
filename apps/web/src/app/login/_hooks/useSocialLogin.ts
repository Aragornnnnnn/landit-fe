'use client';

// 로그인 버튼 → 네이티브에 소셜 로그인 요청 → idToken 수신 → /social-login → 상태 저장 → 라우팅
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { socialLogin } from '@/api/auth/social-login';
import { postToNative, subscribeFromNative } from '@/bridge/web-bridge';
import { useAuthStore } from '@/store/auth-store';

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
          if (!message.cancelled) setError(message.message);
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
          // newUser는 로그인 시점 분기용이라 전역 상태에는 빼고 저장한다. 온보딩 화면이 생기면 여기서 분기한다.
          const { newUser, ...member } = user;
          setAuth(accessToken, refreshToken, member);
          router.replace('/home');
        } catch (error) {
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

  const login = (provider: SocialProvider) => {
    setError(null);
    // WebView 밖(일반 브라우저)이면 네이티브 SDK가 없어 로그인할 수 없다
    if (!postToNative({ type: 'SOCIAL_LOGIN_REQUEST', provider })) {
      setError('앱에서만 로그인할 수 있어요.');
      return;
    }
    setPending(provider);
  };

  return { login, pending, error };
}
