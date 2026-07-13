'use client';

// 개발용 로그인 우회 — OAuth 없이 가짜 세션을 넣어 보호 화면을 바로 본다 (NEXT_PUBLIC_ENABLE_DEV_LOGIN=true일 때만 노출)
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/store/auth-store';

export const DevLoginButton = () => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'true') return null;

  const devLogin = () => {
    // 보호 레이아웃은 refreshToken 존재만 보고, 표현·시나리오는 MSW가 mock으로 응답한다 → 실서버 없이 화면 확인 가능
    setAuth('dev-access-token', 'dev-refresh-token', {
      userId: 1,
      nickname: '개발자',
      email: null,
      provider: 'dev',
    });
    router.replace('/home');
  };

  return (
    <button
      onClick={devLogin}
      className="mt-3 w-full rounded-xl border-2 border-dashed border-primary py-3.5 text-sm font-bold text-primary"
    >
      개발용 로그인 (우회) · 웹에서 화면 보기
    </button>
  );
};
