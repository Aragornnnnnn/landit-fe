// 앱 헤더 — 왼쪽은 프리미엄 진입(또는 로고), 오른쪽은 열매·편지함·내 정보. 탭 셸과 편지함이 함께 쓴다
import { MailboxButton } from '@/features/mailbox/ui/MailboxButton';
import { HeaderStreak } from '@/features/streak/ui/HeaderStreak';
import { PremiumHeaderEntry } from '@/features/subscription/ui/PremiumHeaderEntry';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { UserIcon } from '@/shared/ui/Icons';

export const AppHeader = () => (
  // 글자 라벨이 빠지면서 아래 여백을 줄여도 답답하지 않다 — 높이는 이제 아이콘 칸(44px)이 정한다
  <header className="flex shrink-0 items-center justify-between bg-background px-5 pt-[max(env(safe-area-inset-top),10px)] pb-1">
    {/* 무료 사용자에게는 프리미엄 진입 알약, 그 밖에는 로고. 로고는 홈으로 돌아가는 길이기도 하다 */}
    <PremiumHeaderEntry />
    {/* 아이콘(18px)이 44px 터치 칸 가운데 앉아 양옆에 13px씩 남는다. 그만큼 당겨야
        마지막 아이콘의 오른쪽 끝이 로고 왼쪽 끝과 같은 자리에서 선다 */}
    <div className="-mr-[13px] flex items-center">
      <HeaderStreak />
      <MailboxButton />
      <HeaderAction href="/me" label="내 정보">
        <UserIcon size={18} />
      </HeaderAction>
    </div>
  </header>
);
