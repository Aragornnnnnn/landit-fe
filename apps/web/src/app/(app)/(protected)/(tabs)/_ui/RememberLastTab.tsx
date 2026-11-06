'use client';

// 탭에 있는 동안 어느 탭인지 기억해 둔다 — 스트릭·내 정보·편지함이 뒤로 갈 때 여기로 돌아온다
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { rememberTab } from '@/shared/lib/last-tab';

export const RememberLastTab = () => {
  const pathname = usePathname();

  useEffect(() => {
    rememberTab(pathname);
  }, [pathname]);

  return null;
};
