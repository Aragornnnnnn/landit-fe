'use client';

// 스몰톡 시작 문 — 무료 5분 정책이 켜졌으면 바로 들이고, 꺼졌으면(적용 시각 전) 예전처럼 페이월 게이트를 거친다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { SMALLTALK_PATH } from '@/shared/lib/routes';

/**
 * @param trialOn 서버가 무료 5분 정책을 켰는가(스몰톡 메인의 freeTrialEnabled). 메인을 아직 못 받았으면 false
 */
export const useSmallTalkStart = (trialOn: boolean) => {
  const { guard } = usePaywallGate();
  // 켜졌으면 다 쓴 사람은 서버 canStart가 시작 버튼을 치우므로 여기서 다시 막지 않는다
  return (go: () => void) =>
    trialOn
      ? go()
      : guard(go, { source: 'smalltalk', returnTo: SMALLTALK_PATH });
};
