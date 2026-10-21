'use client';

// 환급 화면(/reward) — 참여자에게는 쌓인 환급액을, 무료 유저에게는 환급 소개를 보여 준다
import { useEffect, useEffectEvent, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { InviteBand } from '@/features/referral/ui/InviteBand';
import {
  missedRewardOf,
  pastDaysOf,
} from '@/features/reward/model/missed-reward';
import { dailyWonOf } from '@/features/reward/model/reward-status';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { track } from '@/shared/analytics';
import { getDeviceToday } from '@/shared/lib/device-today';
import { homePath } from '@/shared/lib/last-tab';
import { paywallPath, REWARD_PATH } from '@/shared/lib/routes';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { glowOf, potStageOf } from '../_model/pot-stage';
import {
  exitOfferDue,
  markExitOfferShown,
  readExitOfferShownDate,
} from '../_model/reward-exit-offer';
import { rewardIntroCopyOf } from '../_model/reward-intro-copy';
import {
  rewardScreenViewOf,
  rewardViewedPropsOf,
} from '../_model/reward-screen-view';
import { useMyReward } from '../../_model/useMyReward';
import { useRewardOffer } from '../../_model/useRewardOffer';
import { MissedRewardIntro } from './MissedRewardIntro';
import { RefundApplyButton } from './RefundApplyButton';
import { RewardExitOfferSheet } from './RewardExitOfferSheet';
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
  // 무료로 며칠 해 온 사람은 소개 대신 놓친 환급액을 본다 — 오늘 했는지도 같은 응답에 들어 있다
  const missed = intro ? missedRewardOf(my.preview, my.computedAt) : null;
  // 처음 보는 소개의 글자는 지금 파는 챌린지의 값과, 오늘의 시나리오를 이미 했는지로 정한다 — 미리보기가 없을 수 있어(구 서버) 오늘은 오늘의 시나리오 응답으로 본다
  const offer = useRewardOffer({ enabled: intro });
  const { daily, isLoading: dailyLoading } = useDailyScenarioQuery(undefined, {
    enabled: intro && missed === null,
  });
  // 오늘 대화를 했는지 알기 전에는 소개를 그리지 않는다 — 대화 전 판이 비쳤다가 대화 후 판으로 바뀌면 글자가 바뀐다
  const introReady = intro && (missed !== null || !dailyLoading);
  const talkedToday = daily?.scenario?.completed === true;
  const introCopy = rewardIntroCopyOf(offer, talkedToday);

  // 위쪽 빛은 그림을 따른다 — 놓친 환급액은 빨갛게, 처음 보는 소개는 흰 바탕
  const glow =
    view.kind === 'record'
      ? glowOf(potStageOf(view.reward))
      : introReady && missed
        ? 'missed'
        : null;

  // 결제 전 화면(소개·놓친 금액)에서 나가려 하면 하루 한 번 신규 회원 특가로 붙잡는다
  const [exitOfferOpen, setExitOfferOpen] = useState(false);
  const exitStatus = missed ? 'missed' : 'intro';
  const leave = () => router.replace(homePath());
  const goBack = () => {
    const today = getDeviceToday();
    if (!introReady || !exitOfferDue(readExitOfferShownDate(), today)) {
      leave();
      return;
    }
    markExitOfferShown(today);
    setExitOfferOpen(true);
    track(EVENTS.REWARD_EXIT_OFFER_VIEWED, { status: exitStatus });
  };
  const startFromExitOffer = () => {
    track(EVENTS.REWARD_EXIT_OFFER_TAPPED, {
      status: exitStatus,
      action: 'start',
    });
    router.replace(
      paywallPath({ source: 'reward', from: REWARD_PATH, step: 'checkout' }),
    );
  };
  const leaveFromExitOffer = () => {
    track(EVENTS.REWARD_EXIT_OFFER_TAPPED, {
      status: exitStatus,
      action: 'leave',
    });
    leave();
  };

  // 기존 월간·연간 유저처럼 환급과 상관없는 사람 — 보여 줄 것이 없다
  const outsider = view.kind === 'outsider';
  useEffect(() => {
    if (outsider) router.replace(homePath());
  }, [outsider, router]);

  // 어떤 상태로 봤는지 — 볼 것이 정해진 순간 한 번, 보는 중에 상태가 바뀌면(자정을 넘겨 오늘이 다시 아직이 되는 등) 다시 찍는다
  const viewed = rewardViewedPropsOf(
    view,
    my.preview ? pastDaysOf(my.preview) : undefined,
  );
  const reportViewed = useEffectEvent(() => {
    if (viewed) track(EVENTS.REWARD_VIEWED, viewed);
  });
  useEffect(() => {
    reportViewed();
  }, [viewed?.status]);

  return (
    <RewardFrame
      onBack={goBack}
      trailing={
        view.kind === 'record' ? (
          <RewardRulesButton dailyWon={dailyWonOf(view.reward)} />
        ) : introReady && missed ? (
          // 처음 보는 소개(대화 0~2일)는 화면에 같은 동전 그림이 있어 ⓘ를 두지 않는다
          <RewardRulesButton dailyWon={offer.dailyWon} />
        ) : undefined
      }
      fadeAboveFooter={introReady}
      glow={glow}
      footer={
        introReady ? (
          <RewardStartButton label={introCopy.cta} />
        ) : view.kind === 'record' ? (
          <RefundApplyButton reward={view.reward} />
        ) : null
      }
    >
      {(view.kind === 'loading' || (intro && !introReady)) && (
        <RewardSkeleton />
      )}
      {introReady &&
        (missed ? (
          <MissedRewardIntro missed={missed} />
        ) : (
          <RewardIntro copy={introCopy} offer={offer} />
        ))}
      {view.kind === 'record' && (
        <RewardRecord
          reward={view.reward}
          invite={<InviteBand className="mx-5 mt-5" />}
          history={<RewardHistoryFeed />}
        />
      )}
      {view.kind === 'error' && (
        <RetryNotice
          screen="reward"
          message={view.error.message}
          onRetry={retry}
        />
      )}
      <RewardExitOfferSheet
        open={exitOfferOpen}
        offer={offer}
        onStart={startFromExitOffer}
        onLeave={leaveFromExitOffer}
        onClose={() => setExitOfferOpen(false)}
      />
    </RewardFrame>
  );
};
