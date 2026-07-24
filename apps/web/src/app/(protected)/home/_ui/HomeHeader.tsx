// 홈 헤더 — 로고와 의견 보내기·내 정보 진입
import Link from 'next/link';

import { FeedbackButton } from '@/features/nps/ui/FeedbackButton';
import { UserIcon } from '@/shared/ui/Icons';
import { LanditLogo } from '@/shared/ui/LanditLogo';

export const HomeHeader = () => (
  <header className="flex shrink-0 items-center justify-between bg-background px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2">
    <LanditLogo className="h-5 w-auto text-foreground [&_.logo-dot-splash]:hidden" />
    <div className="-mr-1.5 flex items-center">
      <FeedbackButton />
      <Link
        href="/me"
        aria-label="내 정보"
        className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-muted-foreground transition-all active:scale-90 active:bg-secondary"
      >
        <UserIcon size={18} />
        <span className="text-[10px] font-medium whitespace-nowrap">
          내 정보
        </span>
      </Link>
    </div>
  </header>
);
