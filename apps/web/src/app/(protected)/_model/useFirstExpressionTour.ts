// 첫 표현 투어 배선 — 페이월 게이트가 잠그고 환급 챌린지를 팔 수 있는 사람에게만 투어 단계와 저장 함수를 내준다
'use client';

// 가로 import 사유: 투어는 무료 구간이 끝나는 자리를 옮기는 기능이라 같은 게이트 판정을 쓴다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { useRewardChallengeLive } from '@/features/subscription/model/paywall-gate/useRewardChallengeLive';
import { tourScreenOf } from '@/features/tour/model/tour-step';
import { useTourStep } from '@/features/tour/model/useTourStep';

export const useFirstExpressionTour = () => {
  const gate = usePaywallGate();
  // 투어는 환급 챌린지를 소개한다 — 챌린지를 팔 수 없는 환경(스위치 꺼짐·구버전 앱)에서는 열지 않는다
  const rewardLive = useRewardChallengeLive();
  const { step, saveStep } = useTourStep();
  // 투어를 볼 수 있는 사람인가 — 유료·결제 못 하는 환경에는 투어가 없다
  const known = gate.locked && rewardLive;

  return {
    known,
    step: known ? step : null,
    screen: known ? tourScreenOf(step) : ('none' as const),
    saveStep,
  };
};
