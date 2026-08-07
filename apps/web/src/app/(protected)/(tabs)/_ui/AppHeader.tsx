// 앱 헤더 — 로고와 열매·의견 보내기·내 정보 진입. 탭이 늘면 탭들이 공유한다
import { FeedbackButton } from '@/features/nps/ui/FeedbackButton';
import { HeaderStreak } from '@/features/streak/ui/HeaderStreak';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { UserIcon } from '@/shared/ui/Icons';
import { LanditLogo } from '@/shared/ui/LanditLogo';

export const AppHeader = () => (
  <header className="flex shrink-0 items-center justify-between bg-background px-5 pt-[max(env(safe-area-inset-top),16px)] pb-2">
    <LanditLogo className="h-5 w-auto text-foreground [&_.logo-dot-splash]:hidden" />
    <div className="-mr-1.5 flex items-center">
      <HeaderStreak />
      <FeedbackButton />
      <HeaderAction href="/me" label="내 정보">
        <UserIcon size={18} />
      </HeaderAction>
    </div>
  </header>
);
