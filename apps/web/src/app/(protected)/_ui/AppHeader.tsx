'use client';

// 앱 헤더 — 왼쪽은 환급 참여자면 쌓인 금액, 그 밖에는 프리미엄 진입(또는 로고), 오른쪽은 열매·편지함·내 정보
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { MailboxButton } from '@/features/mailbox/ui/MailboxButton';
import { missedRewardOf } from '@/features/reward/model/missed-reward';
import {
  balanceOf,
  rewardBadgeOf,
} from '@/features/reward/model/reward-status';
import { useBalanceGain } from '@/features/reward/model/useBalanceGain';
import { MissedEarnShower } from '@/features/reward/ui/common/MissedEarnShower';
import {
  HeaderReward,
  RewardInviteLabel,
} from '@/features/reward/ui/HeaderReward';
import { RewardInviteBubble } from '@/features/reward/ui/RewardInviteBubble';
import { HeaderStreak } from '@/features/streak/ui/HeaderStreak';
import {
  PREMIUM_ENTRY_PILL_CLASS,
  PremiumHeaderEntry,
} from '@/features/subscription/ui/PremiumHeaderEntry';
import { track } from '@/shared/analytics';
import { MY_PAGE_PATH, REWARD_PATH } from '@/shared/lib/routes';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { UserIcon } from '@/shared/ui/Icons';

import { useMissedEarnInvite } from '../_model/useMissedEarnInvite';
import { useMyReward } from '../_model/useMyReward';
import { usePremiumPreview } from '../_model/usePremiumPreview';

export const AppHeader = () => {
  const { reward, loaded, invited, settled, preview, computedAt, storedWon } =
    useMyReward();
  const badge = reward && rewardBadgeOf(reward);
  // 환급을 권할 사람이 오늘의 시나리오를 끝내고 돌아왔으면, 받을 수 있었던 동전이 진입 알약으로 날아간다.
  // 놓친 환급액을 보여 줄 만큼 무료로 해 온 사람에게는 알약이 놓친 금액을 말한다 — 환급 소개와 같은 판정이다
  const {
    entryRef,
    dailyWon,
    pillWon,
    landWon,
    missed,
    shower,
    endShower,
    bubble,
  } = useMissedEarnInvite(invited, missedRewardOf(preview, computedAt));
  // 프리미엄 프리뷰의 튜토리얼 차례 — 동전은 프리미엄 진입 알약으로 날아가고, 말풍선 대신 튜토리얼이 이어서 말한다
  const previewIntro = usePremiumPreview().screen === 'tutorial';
  // 이번 방문에 튜토리얼이 있었으면 말풍선은 띄우지 않는다 — 동전이 닿을 때 열린 말풍선이 튜토리얼이 끝난 뒤 스포트라이트 위로 뜨지 않게
  const [previewShown, setPreviewShown] = useState(false);
  if (previewIntro && !previewShown) setPreviewShown(true);
  // 학습을 끝내고 돌아왔으면 그사이 늘어난 만큼 동전이 알약으로 날아든다
  const { gain, endGain } = useBalanceGain(
    // 알약이 없으면 연출을 틀 자리도 없다 — 끝나지 않는 연출을 기다리며 홈의 시트가 막히지 않게 금액도 없는 것으로 넘긴다
    badge && reward ? balanceOf(reward) : null,
    loaded && reward === null,
  );

  return (
    // 글자 라벨이 빠지면서 아래 여백을 줄여도 답답하지 않다 — 높이는 이제 아이콘 칸(44px)이 정한다
    <header className="flex shrink-0 items-center justify-between bg-background px-5 pt-[max(var(--safe-area-inset-top),10px)] pb-1">
      {badge ? (
        <HeaderReward badge={badge} gain={gain} onGainEnd={endGain} />
      ) : (
        // 감싼 칸의 자리가 곧 알약의 자리다 — 동전 연출과 말풍선이 이 자리를 잰다
        <div ref={entryRef}>
          <PremiumHeaderEntry
            // 환급 참여자인지 아직 모르면 로고로 기다린다 — 진입 알약이 비쳤다 금액으로 바뀌지 않게
            holding={!settled}
            // 환급을 권할 사람에게만 진입을 환급 소개로 돌린다 — 그 밖에는 지금의 프리미엄 진입 그대로다
            invite={
              invited && !previewIntro
                ? {
                    href: REWARD_PATH,
                    label: (
                      <RewardInviteLabel
                        amountWon={pillWon}
                        missed={missed}
                        storedWon={storedWon}
                      />
                    ),
                    onClick: () =>
                      track(EVENTS.REWARD_ENTRY_TAPPED, {
                        source: 'header',
                      }),
                  }
                : undefined
            }
          />
        </div>
      )}
      {shower && (
        <MissedEarnShower
          pill={shower.pill}
          amountWon={dailyWon}
          renderPill={(landed) => (
            <span
              className={`${PREMIUM_ENTRY_PILL_CLASS} animate-gold-flow whitespace-nowrap`}
            >
              {previewIntro ? (
                <>
                  <span className="tracking-[0.1em]">PREMIUM</span>
                  <span>시작하기</span>
                </>
              ) : (
                <RewardInviteLabel
                  amountWon={landed ? landWon : null}
                  missed={missed}
                />
              )}
            </span>
          )}
          onLand={shower.onLand}
          onEnd={endShower}
        />
      )}
      {bubble && !previewShown && (
        <RewardInviteBubble
          pill={bubble.pill}
          amountWon={dailyWon}
          missed={missed}
          onClose={bubble.onClose}
        />
      )}

      {/* 아이콘(18px)이 44px 터치 칸 가운데 앉아 양옆에 13px씩 남는다. 그만큼 당겨야
        마지막 아이콘의 오른쪽 끝이 로고 왼쪽 끝과 같은 자리에서 선다 */}
      <div className="-mr-[13px] flex items-center">
        <HeaderStreak />
        <MailboxButton />
        <HeaderAction href={MY_PAGE_PATH} label="내 정보">
          <UserIcon size={18} />
        </HeaderAction>
      </div>
    </header>
  );
};
