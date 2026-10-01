// 페이월 게이트 판정 — 잠글 수 없는 환경과 유료 여부를 한 곳에서 가른다.
// 잠금은 학습 진입 지점에서만 건다. 화면 전체를 막지 않는다 (docs/subscription.md)

export interface PaymentEnvironment {
  /** NEXT_PUBLIC_PAYMENT_ENABLED — 결제를 막아야 할 때 끄는 웹 스위치 */
  paymentEnabled: boolean;
  /** 셸 안에서 열렸는가. 브라우저면 false */
  inApp: boolean;
}

export interface PaywallGateInput {
  /** 잠글 수 있는 환경인가 — {@link canLockPaywall}의 결과 */
  lockable: boolean;
  /** 유료인가. 아직 못 받았으면 null — 모르는 채로 잠그지 않는다 */
  premium: boolean | null;
}

/** open: 그냥 들어간다 / locked: 페이월로 보낸다 / unknown: 판단 재료가 오는 중이라 잠시 보류 */
export type PaywallGateDecision = 'open' | 'locked' | 'unknown';

/**
 * 잠글 수 있는 환경인가 — 결제 플래그가 켜져 있고 앱 안일 때만.
 * 브라우저에서 막으면 사용자가 갈 데가 없다.
 */
export const canLockPaywall = ({ paymentEnabled, inApp }: PaymentEnvironment) =>
  paymentEnabled && inApp;

/**
 * 학습 진입(표현 학습·카드 뒤집기·스몰톡 시작)을 열지 잠글지 정한다. 잠글 수 없는 환경이 먼저고, 유료가 그다음.
 * 시나리오 대화는 문이 아니다 — 구독과 관계없이 열려 있고, 상세 피드백 잠금은 서버가 피드백 응답에서 정한다
 */
export const decidePaywallGate = ({
  lockable,
  premium,
}: PaywallGateInput): PaywallGateDecision => {
  if (!lockable) return 'open';
  if (premium === null) return 'unknown';
  return premium ? 'open' : 'locked';
};
