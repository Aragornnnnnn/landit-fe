'use client';

// 환급 화면(/reward) — 참여자에게는 쌓인 환급액을, 무료 유저에게는 환급 소개를 보여 준다
import { useEffect, useEffectEvent } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import {
  rewardScreenViewOf,
  rewardViewedPropsOf,
} from '../_model/reward-screen-view';
import { useMyReward } from '../../_model/useMyReward';
import { RefundApplyButton } from './RefundApplyButton';
import { RewardFrame } from './RewardFrame';
import { RewardHistoryFeed } from './RewardHistoryFeed';
import { RewardIntro, RewardStartButton } from './RewardIntro';
import { RewardRecord } from './RewardRecord';
import { RewardSkeleton } from './RewardSkeleton';

export const RewardScreen = () => {
  const router = useRouter();
  const { retry, ...my } = useMyReward();
  const view = rewardScreenViewOf(my);

  // 기존 월간·연간 유저처럼 환급과 상관없는 사람 — 보여 줄 것이 없다
  const outsider = view.kind === 'outsider';
  useEffect(() => {
    if (outsider) router.replace(homePath());
  }, [outsider, router]);

  // 어떤 상태로 봤는지 — 볼 것이 정해진 순간 한 번, 보는 중에 상태가 바뀌면(자정을 넘겨 0원이 되는 등) 다시 찍는다
  const viewed = rewardViewedPropsOf(view);
  const reportViewed = useEffectEvent(() => {
    if (viewed) track(EVENTS.REWARD_VIEWED, viewed);
  });
  useEffect(() => {
    reportViewed();
  }, [viewed?.status]);

  return (
    <RewardFrame
      onBack={() => router.replace(homePath())}
      fadeAboveFooter={view.kind === 'intro'}
      footer={
        view.kind === 'intro' ? (
          <RewardStartButton />
        ) : view.kind === 'record' ? (
          <RefundApplyButton reward={view.reward} />
        ) : null
      }
    >
      {view.kind === 'loading' && <RewardSkeleton />}
      {view.kind === 'intro' && <RewardIntro />}
      {view.kind === 'record' && (
        <RewardRecord reward={view.reward} history={<RewardHistoryFeed />} />
      )}
      {view.kind === 'error' && (
        <RetryNotice
          screen="reward"
          message={view.error.message}
          onRetry={retry}
        />
      )}
    </RewardFrame>
  );
};
