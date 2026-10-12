'use client';

// 환급 화면(/reward) — 참여자에게는 쌓인 환급액을, 무료 유저에게는 환급 소개를 보여 준다
import { useEffect, useEffectEvent } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { dailyWonOf } from '@/features/reward/model/reward-status';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { glowOf, potStageOf } from '../_model/pot-stage';
import { rewardIntroCopyOf } from '../_model/reward-intro-copy';
import {
  rewardScreenViewOf,
  rewardViewedPropsOf,
} from '../_model/reward-screen-view';
import { useMyReward } from '../../_model/useMyReward';
import { useRewardOffer } from '../../_model/useRewardOffer';
import { RefundApplyButton } from './RefundApplyButton';
import { RewardFrame } from './RewardFrame';
import { RewardHistoryFeed } from './RewardHistoryFeed';
import { RewardIntro, RewardStartButton } from './RewardIntro';
import { RewardRecord } from './RewardRecord';
import { RewardRulesButton } from './RewardRulesButton';
import { RewardSkeleton } from './RewardSkeleton';

export const RewardScreen = () => {
  const router = useRouter();
  const { retry, ...my } = useMyReward();
  const view = rewardScreenViewOf(my);
  const intro = view.kind === 'intro';
  // 소개 화면의 글자는 지금 파는 챌린지의 값과, 오늘의 시나리오를 이미 했는지로 정한다 — 무료 사용자는 환급 응답에 오늘이 없어 오늘의 시나리오 응답으로 본다
  const offer = useRewardOffer();
  const { daily } = useDailyScenarioQuery(undefined, { enabled: intro });
  const talkedToday = daily?.scenario?.completed === true;
  const introCopy = rewardIntroCopyOf(offer, talkedToday);

  // 위쪽 빛은 그림을 따른다 — 오늘 대화를 한 사람의 소개는 오늘 받은 환급 화면과 같은 금빛이다
  const glow =
    view.kind === 'record'
      ? glowOf(potStageOf(view.reward))
      : intro && talkedToday
        ? 'gold'
        : null;

  // 기존 월간·연간 유저처럼 환급과 상관없는 사람 — 보여 줄 것이 없다
  const outsider = view.kind === 'outsider';
  useEffect(() => {
    if (outsider) router.replace(homePath());
  }, [outsider, router]);

  // 어떤 상태로 봤는지 — 볼 것이 정해진 순간 한 번, 보는 중에 상태가 바뀌면(자정을 넘겨 오늘이 다시 아직이 되는 등) 다시 찍는다
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
      trailing={
        view.kind === 'record' ? (
          <RewardRulesButton dailyWon={dailyWonOf(view.reward)} />
        ) : intro ? (
          <RewardRulesButton dailyWon={offer.dailyWon} />
        ) : undefined
      }
      fadeAboveFooter={intro}
      glow={glow}
      footer={
        intro ? (
          <RewardStartButton label={introCopy.cta} />
        ) : view.kind === 'record' ? (
          <RefundApplyButton reward={view.reward} />
        ) : null
      }
    >
      {view.kind === 'loading' && <RewardSkeleton />}
      {intro && (
        <RewardIntro
          copy={introCopy}
          dailyWon={offer.dailyWon}
          talkedToday={talkedToday}
        />
      )}
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
