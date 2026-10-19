// 첫 표현 투어 배선 — 페이월 게이트가 잠그고 환급 챌린지를 팔 수 있는 사람에게만 투어 단계와 저장·마무리를 내준다
'use client';

import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

// 가로 import 사유: 투어는 무료 구간이 끝나는 자리를 옮기는 기능이라 같은 게이트 판정을 쓴다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { useRewardChallengeLive } from '@/features/subscription/model/paywall-gate/useRewardChallengeLive';
import { tourScreenOf } from '@/features/tour/model/tour-step';
import { useTourStep } from '@/features/tour/model/useTourStep';
import { track } from '@/shared/analytics';
import { paywallPath } from '@/shared/lib/routes';

export const useFirstExpressionTour = () => {
  const router = useRouter();
  const gate = usePaywallGate();
  // 투어는 환급 챌린지를 소개한다 — 챌린지를 팔 수 없는 환경(스위치 꺼짐·구버전 앱)에서는 열지 않는다
  const rewardLive = useRewardChallengeLive();
  const { step, saveStep } = useTourStep();
  // 투어를 볼 수 있는 사람인가 — 유료·결제 못 하는 환경에는 투어가 없다
  const eligible = gate.locked && rewardLive;

  return {
    eligible,
    step: eligible ? step : null,
    screen: eligible ? tourScreenOf(step) : ('none' as const),
    saveStep,
    // 투어의 끝 — 투어를 끝낸 것으로 남기고 페이월로 보낸다
    finishWithPaywall: () => {
      saveStep('COMPLETED');
      track(EVENTS.PAYWALL_GATE_LOCKED, { source: 'first_expression_tour' });
      router.replace(paywallPath({ source: 'first_expression_tour' }));
    },
  };
};
