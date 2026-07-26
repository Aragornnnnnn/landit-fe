// 이미 로그인된 상태로 /login에 오면 홈으로 돌려보내는 가드 로직
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/auth/auth-store';

export const useAuthedRedirect = () => {
  const router = useRouter();

  // 마운트 시점 스냅샷으로 한 번만 판단한다 (persist 복원은 동기라 이 시점엔 끝나 있다).
  // 상태 변화를 구독하면 이 화면에서 진행되는 브릿지 로그인의 온보딩 라우팅을 /home으로 덮어쓴다.
  useEffect(() => {
    if (useAuthStore.getState().refreshToken !== null) router.replace('/home');
  }, [router]);
};
