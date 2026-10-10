'use client';

// 환급 화면(/refund) — 참여자에게는 쌓인 환급액을, 무료 유저에게는 환급 소개를 보여 준다
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { homePath } from '@/shared/lib/last-tab';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { refundViewOf } from '../_model/refund-view';
import { useMyReward } from '../../_model/useMyReward';
import { RefundApplyButton } from './RefundApplyButton';
import { RefundFrame } from './RefundFrame';
import { RefundHistoryFeed } from './RefundHistoryFeed';
import { RefundIntro, RefundStartButton } from './RefundIntro';
import { RefundRecord } from './RefundRecord';
import { RefundSkeleton } from './RefundSkeleton';

export const RefundScreen = () => {
  const router = useRouter();
  const { retry, ...my } = useMyReward();
  const view = refundViewOf(my);

  // 기존 월간·연간 유저처럼 환급과 상관없는 사람 — 보여 줄 것이 없다
  const outsider = view.kind === 'outsider';
  useEffect(() => {
    if (outsider) router.replace(homePath());
  }, [outsider, router]);

  return (
    <RefundFrame
      onBack={() => router.replace(homePath())}
      fadeAboveFooter={view.kind === 'intro'}
      footer={
        view.kind === 'intro' ? (
          <RefundStartButton />
        ) : view.kind === 'record' ? (
          <RefundApplyButton reward={view.reward} />
        ) : null
      }
    >
      {view.kind === 'loading' && <RefundSkeleton />}
      {view.kind === 'intro' && <RefundIntro />}
      {view.kind === 'record' && (
        <RefundRecord reward={view.reward} history={<RefundHistoryFeed />} />
      )}
      {view.kind === 'error' && (
        <RetryNotice
          screen="refund"
          message={view.error.message}
          onRetry={retry}
        />
      )}
    </RefundFrame>
  );
};
