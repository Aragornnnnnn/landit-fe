'use client';

// 인증 가드 레이아웃 — 비로그인이면 /login으로 보낸다. 보호가 필요한 페이지는 이 그룹에 넣는다
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useClientOnlyValue } from '@/hooks/useClientOnlyValue';
import { useAuthStore } from '@/store/auth-store';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthed = useAuthStore((state) => state.refreshToken !== null);
  // true가 된 시점엔 persist 복원(동기 localStorage)이 끝나 있어 로그인 여부를 믿고 판단할 수 있다
  const hydrated = useClientOnlyValue(() => true, false);

  useEffect(() => {
    if (hydrated && !isAuthed) router.replace('/login');
  }, [hydrated, isAuthed, router]);

  // 판단 전이거나 리다이렉트 대기 중엔 보호 콘텐츠를 그리지 않는다
  if (!hydrated || !isAuthed) return null;
  return children;
}
