// 페이월 게이트 판정 — 잠글 수 없는 환경과 유료 여부를 한 곳에서 가른다.
// 잠금은 학습 진입 지점에서만 건다. 화면 전체를 막지 않는다 (docs/subscription.md)
import { isAppVersionAtLeast } from '@/shared/bridge/app-version';

// 결제 브릿지가 실린 첫 앱 릴리즈 — 이보다 낮은 셸에는 결제 시트를 띄울 수 없다
const PAYWALL_MIN_APP_VERSION = '1.3.0';

export interface PaywallGateInput {
  /** NEXT_PUBLIC_PAYMENT_ENABLED — 심사 기간과 오픈 시점을 가르는 웹 플래그 */
  paymentEnabled: boolean;
  /** 셸이 주입한 앱 버전. 브라우저면 null */
  appVersion: string | null;
  /** 유료인가. 아직 못 받았으면 null — 모르는 채로 잠그지 않는다 */
  premium: boolean | null;
}

/** open: 그냥 들어간다 / locked: 페이월로 보낸다 / unknown: 판단 재료가 오는 중이라 잠시 보류 */
export type PaywallGateDecision = 'open' | 'locked' | 'unknown';

/**
 * 잠글 수 있는 환경인가 — 결제 플래그가 켜져 있고 결제 브릿지가 실린 셸(1.3.0 이상)일 때만.
 * 브라우저(appVersion 없음)에서 막으면 사용자가 갈 데가 없다.
 */
export const canLockPaywall = ({
  paymentEnabled,
  appVersion,
}: Pick<PaywallGateInput, 'paymentEnabled' | 'appVersion'>) =>
  paymentEnabled &&
  appVersion !== null &&
  isAppVersionAtLeast(appVersion, PAYWALL_MIN_APP_VERSION);

/**
 * 학습 진입(표현 학습·카드 뒤집기·스몰톡 시작)을 열지 잠글지 정한다. 잠글 수 없는 환경이 먼저고, 유료가 그다음.
 * 시나리오 대화는 문이 아니다 — 구독과 관계없이 열려 있고, 상세 피드백 잠금은 서버가 피드백 응답에서 정한다
 */
export const decidePaywallGate = (
  input: PaywallGateInput,
): PaywallGateDecision => {
  if (!canLockPaywall(input)) return 'open';
  if (input.premium === null) return 'unknown';
  return input.premium ? 'open' : 'locked';
};
