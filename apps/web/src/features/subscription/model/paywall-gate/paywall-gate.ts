// 페이월 게이트 판정 — 결제가 열린 환경인지와 유료 여부를 한 곳에서 가른다.
// 잠금은 학습 진입 지점에서만 건다. 화면 전체를 막지 않는다 (docs/subscription.md)
import type { NativeContext } from '@landit/bridge';

import { isAppVersionAtLeast } from '@/shared/bridge/app-version';

export interface PaymentEnvironment {
  /** NEXT_PUBLIC_PAYMENT_ENABLED — 결제를 막아야 할 때 끄는 웹 스위치 */
  paymentEnabled: boolean;
  /** 셸 안에서 열렸는가. 브라우저면 false */
  inApp: boolean;
}

export interface PaywallGateInput {
  /** 결제가 열린 환경인가 — {@link isPaymentLive}의 결과. 열리지 않았으면 잠그지 않는다 */
  paymentLive: boolean;
  /** 유료인가. 아직 못 받았으면 null — 모르는 채로 잠그지 않는다 */
  premium: boolean | null;
}

export interface RewardEnvironment {
  /** NEXT_PUBLIC_REFUND_CHALLENGE — 환급 챌린지 배포 스위치 */
  rewardEnabled: boolean;
  /** 셸이 준 플랫폼·앱 버전. 브라우저면 null */
  context: NativeContext | null;
}

// 환급 상품이 실린 앱 버전 — 스토어 심사가 플랫폼마다 따로라 따로 적는다. 적지 않은 플랫폼은 아직 열지 않았다
const REWARD_MIN_APP_VERSION: Partial<
  Record<NativeContext['platform'], string>
> = { ios: '1.4.0' };

/** open: 그냥 들어간다 / locked: 페이월로 보낸다 / unknown: 판단 재료가 오는 중이라 잠시 보류 */
export type PaywallGateDecision = 'open' | 'locked' | 'unknown';

/**
 * 결제가 열린 환경인가 — 결제 플래그가 켜져 있고 앱 안일 때만.
 * 열리지 않은 곳(브라우저)에서는 페이월로 막지 않는다. 결제할 수 없는 곳에서 막으면 사용자가 갈 데가 없다.
 */
export const isPaymentLive = ({ paymentEnabled, inApp }: PaymentEnvironment) =>
  paymentEnabled && inApp;

/**
 * 환급 챌린지가 열린 환경인가 — 스위치가 켜져 있고, 환급 상품이 실린 앱 버전일 때만.
 * 그 전 버전에 열면 심사를 통과하지 않은 상품이 기존 사용자에게 보여 결제가 실패한다.
 */
export const isRewardChallengeLive = ({
  rewardEnabled,
  context,
}: RewardEnvironment) => {
  if (!rewardEnabled || context === null) return false;
  const minimum = REWARD_MIN_APP_VERSION[context.platform];
  return (
    minimum !== undefined && isAppVersionAtLeast(context.appVersion, minimum)
  );
};

/**
 * 학습 진입(표현 학습·카드 뒤집기·스몰톡 시작)을 열지 잠글지 정한다. 결제가 열린 환경인지가 먼저고, 유료가 그다음.
 * 시나리오 대화는 문이 아니다 — 구독과 관계없이 열려 있고, 상세 피드백 잠금은 서버가 피드백 응답에서 정한다
 */
export const decidePaywallGate = ({
  paymentLive,
  premium,
}: PaywallGateInput): PaywallGateDecision => {
  if (!paymentLive) return 'open';
  if (premium === null) return 'unknown';
  return premium ? 'open' : 'locked';
};
