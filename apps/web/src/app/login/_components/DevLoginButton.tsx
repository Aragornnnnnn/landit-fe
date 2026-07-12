'use client';

// 개발 전용 가짜 로그인 — 브릿지 없는 웹 단독 환경에서 보호 페이지를 확인할 때 쓴다. 프로덕션 빌드에선 렌더되지 않는다
import { useAuthStore } from '@/shared/store/auth-store';

export const DevLoginButton = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button
      type="button"
      className="py-2 text-center text-xs font-medium text-muted-foreground underline underline-offset-2"
      // 가짜 토큰이라 백엔드 API는 실패한다 — 화면 진입 확인 용도로만 쓴다
      onClick={() =>
        setAuth('dev-access-token', 'dev-refresh-token', {
          userId: 0,
          nickname: '개발자',
          email: 'dev@localhost',
          provider: 'DEV',
        })
      }
    >
      개발용 로그인 (배포에선 안 보임)
    </button>
  );
};
