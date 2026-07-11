'use client';

// 이미 로그인된 상태로 /login에 오면 홈으로 돌려보낸다 (화면은 그리지 않는 가드 전용 컴포넌트)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/store/auth-store';

export const AuthedRedirect = () => {
  const router = useRouter();
  const isAuthed = useAuthStore((state) => state.refreshToken !== null);

  // 마운트 이후에만 판단 — 그 시점엔 persist 복원(동기)이 끝나 있다
  useEffect(() => {
    if (isAuthed) router.replace('/');
  }, [isAuthed, router]);

  return null;
};
