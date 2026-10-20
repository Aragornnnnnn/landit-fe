// 프리미엄 프리뷰 배선 — 페이월 게이트가 잠그고 환급 챌린지를 팔 수 있는 사람에게만 프리뷰 단계와 저장·마무리를 내준다
'use client';

import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { isPreviewReplay } from '@/features/premium-preview/model/preview-replay';
import {
  awaitsFreeExpressionFinish,
  previewScreenOf,
} from '@/features/premium-preview/model/preview-step';
import { usePreviewStep } from '@/features/premium-preview/model/usePreviewStep';
// 가로 import 사유: 프리뷰는 무료 구간이 끝나는 자리를 옮기는 기능이라 같은 게이트 판정을 쓴다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { useRewardChallengeLive } from '@/features/subscription/model/paywall-gate/useRewardChallengeLive';
import { track } from '@/shared/analytics';
import { paywallPath } from '@/shared/lib/routes';

export const usePremiumPreview = () => {
  const router = useRouter();
  const gate = usePaywallGate();
  // 프리뷰는 환급 챌린지를 소개한다 — 챌린지를 팔 수 없는 환경(스위치 꺼짐·구버전 앱)에서는 열지 않는다
  const rewardLive = useRewardChallengeLive();
  const { step, saveStep } = usePreviewStep();
  // 프리뷰를 볼 수 있는 사람인가 — 유료·결제 못 하는 환경에는 프리뷰가 없다. 개발자 묶음에서 다시 보기를 켰으면 이번 실행 동안 누구나 본다
  const eligible = (gate.locked && rewardLive) || isPreviewReplay();

  return {
    eligible,
    step: eligible ? step : null,
    screen: eligible ? previewScreenOf(step) : ('none' as const),
    saveStep,
    // 무료 표현 차례(또는 열어 둔 채 나왔을 때)에만 — 표현을 마치면 프리뷰를 끝낸 것으로 남기고 목록 대신 페이월로 보낸다
    onFreeExpressionFinished:
      eligible && awaitsFreeExpressionFinish(step)
        ? () => {
            saveStep('COMPLETED');
            track(EVENTS.PAYWALL_GATE_LOCKED, {
              source: 'premium_preview',
            });
            router.replace(paywallPath({ source: 'premium_preview' }));
          }
        : undefined,
  };
};
