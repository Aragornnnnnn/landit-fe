// 홈 헤더 — 로고와 내 정보 진입
import Link from 'next/link';

import { LanditLogo } from '@/components/LanditLogo';
import { UserIcon } from '@/components/ui/Icons';

export const HomeHeader = () => (
  <header className="flex shrink-0 items-center justify-between bg-background px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2">
    <LanditLogo className="h-5 w-auto text-foreground [&_.logo-dot-splash]:hidden" />
    <Link
      href="/me"
      aria-label="내 정보"
      className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90 active:bg-secondary"
    >
      <UserIcon size={20} />
    </Link>
  </header>
);
