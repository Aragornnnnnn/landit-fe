'use client';

// 앱 헤더 — 왼쪽은 환급 참여자면 쌓인 금액, 그 밖에는 프리미엄 진입(또는 로고), 오른쪽은 열매·편지함·내 정보
import { MailboxButton } from '@/features/mailbox/ui/MailboxButton';
import { rewardBadgeOf } from '@/features/reward/model/reward-status';
import {
  HeaderRefund,
  RefundInviteLabel,
} from '@/features/reward/ui/HeaderRefund';
import { HeaderStreak } from '@/features/streak/ui/HeaderStreak';
import { PremiumHeaderEntry } from '@/features/subscription/ui/PremiumHeaderEntry';
import { REFUND_PATH } from '@/shared/lib/routes';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { UserIcon } from '@/shared/ui/Icons';

import { useMyReward } from '../_model/useMyReward';

export const AppHeader = () => {
  const { reward, invited, settled } = useMyReward();
  const badge = reward && rewardBadgeOf(reward);

  return (
    // 글자 라벨이 빠지면서 아래 여백을 줄여도 답답하지 않다 — 높이는 이제 아이콘 칸(44px)이 정한다
    <header className="flex shrink-0 items-center justify-between bg-background px-5 pt-[max(var(--safe-area-inset-top),10px)] pb-1">
      {badge ? (
        <HeaderRefund badge={badge} />
      ) : (
        <PremiumHeaderEntry
          // 환급 참여자인지 아직 모르면 로고로 기다린다 — 진입 알약이 비쳤다 금액으로 바뀌지 않게
          holding={!settled}
          // 환급을 권할 사람에게만 진입을 환급 소개로 돌린다 — 그 밖에는 지금의 프리미엄 진입 그대로다
          invite={
            invited
              ? { href: REFUND_PATH, label: <RefundInviteLabel /> }
              : undefined
          }
        />
      )}

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
};
