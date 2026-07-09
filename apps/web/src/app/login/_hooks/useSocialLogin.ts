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
          setError(message.message);
          setPending(null);
          return;
        }
        if (message.type !== 'SOCIAL_LOGIN_SUCCESS') return;

        try {
          const { accessToken, refreshToken, user } = await socialLogin(
            message.provider,
            message.idToken,
            message.nonce,
          );
          // newUser는 저장하지 않는다(온보딩 분기용). 온보딩 화면이 생기면 여기서 분기한다.
          setAuth(accessToken, refreshToken, {
            userId: user.userId,
            nickname: user.nickname,
            email: user.email,
            provider: user.provider,
          });
          router.replace('/');
        } catch {
          setError('로그인에 실패했어요. 다시 시도해 주세요.');
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
