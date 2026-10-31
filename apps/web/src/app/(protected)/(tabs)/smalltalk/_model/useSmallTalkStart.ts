'use client';

// 스몰톡 시작 문 — 무료 5분 정책이 켜졌으면 바로 들이고, 꺼졌거나(적용 시각 전) 무료 5분을 다 썼으면 페이월 게이트를 거친다
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { SMALLTALK_PATH } from '@/shared/lib/routes';

const PAYWALL_OPTIONS = {
  source: 'smalltalk',
  returnTo: SMALLTALK_PATH,
} as const;

/**
 * @param trialOn 서버가 무료 5분 정책을 켰는가(스몰톡 메인의 freeTrialEnabled). 메인을 아직 못 받았으면 false
 * @param exhausted 무료 5분을 다 썼는가 — 시작 버튼은 그대로 두고, 누르면 대화 대신 페이월을 연다
 */
export const useSmallTalkStart = ({
  trialOn,
  exhausted,
}: {
  trialOn: boolean;
  exhausted: boolean;
}) => {
  const { guard } = usePaywallGate();
  return (go: () => void) => {
    if (exhausted) guard(() => {}, PAYWALL_OPTIONS);
    else if (trialOn) go();
    else guard(go, PAYWALL_OPTIONS);
  };
};
