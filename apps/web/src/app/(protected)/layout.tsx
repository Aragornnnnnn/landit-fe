'use client';

// 인증 가드 레이아웃 — 비로그인이면 /login으로 보낸다. 보호가 필요한 페이지는 이 그룹에 넣는다
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth-store';

// SSR·하이드레이션 첫 렌더에선 false, 그 뒤 클라이언트에서 true — 서버 HTML과 첫 렌더를 일치시킨다.
// true가 된 시점엔 persist 복원(동기 localStorage)이 끝나 있어 로그인 여부를 믿고 판단할 수 있다.
const emptySubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthed = useAuthStore((state) => state.refreshToken !== null);
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !isAuthed) router.replace('/login');
  }, [hydrated, isAuthed, router]);

  // 판단 전이거나 리다이렉트 대기 중엔 보호 콘텐츠를 그리지 않는다
  if (!hydrated || !isAuthed) return null;
  return children;
}
