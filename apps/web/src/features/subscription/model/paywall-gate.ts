// 페이월 게이트 판정 — 무료로 열어 둘 구간과 잠글 순간, 잠글 수 없는 환경을 한 곳에서 정한다.
// 잠금은 학습 진입 지점에서만 건다. 화면 전체를 막지 않는다 (docs/subscription.md)
import { isAppVersionAtLeast } from '@/shared/bridge/app-version';

// 결제 브릿지가 실린 첫 앱 릴리즈 — 이보다 낮은 셸에는 결제 시트를 띄울 수 없다
const PAYWALL_MIN_APP_VERSION = '1.3.0';

/**
 * 어느 문인가 — 무료 구간은 오늘의 시나리오 대화 하나에만 준다.
 * today_scenario: 오늘 카드의 대화 시작. 오픈 뒤 대화를 하나 끝내기 전까지 열려 있다
 * learning: 그 밖의 학습 문(스몰톡·표현 학습·재대화·지난 카드). 유료가 아니면 늘 잠긴다
 */
export type PaywallDoor = 'today_scenario' | 'learning';

export interface PaywallGateInput {
  door: PaywallDoor;
  /** NEXT_PUBLIC_PAYMENT_ENABLED — 심사 기간과 오픈 시점을 가르는 웹 플래그 */
  paymentEnabled: boolean;
  /** 셸이 주입한 앱 버전. 브라우저면 null */
  appVersion: string | null;
  /** 유료인가. 아직 못 받았으면 null — 모르는 채로 잠그지 않는다 */
  premium: boolean | null;
  /** 결제 오픈 뒤 대화를 하나 끝냈는가. 신규는 첫 대화, 기존 사용자는 오픈 뒤 첫 대화가 여기 걸린다 */
  conversationCompletedSinceLaunch: boolean | null;
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
 * 학습 진입을 열지 잠글지 정한다. 잠글 수 없는 환경이 먼저고, 유료가 그다음.
 * 무료 사용자는 오늘의 시나리오 문만 대화 하나까지 열려 있고, 다른 학습 문은 잠긴다
 */
export const decidePaywallGate = (
  input: PaywallGateInput,
): PaywallGateDecision => {
  if (!canLockPaywall(input)) return 'open';

  const { door, premium, conversationCompletedSinceLaunch } = input;
  if (premium === true) return 'open';
  if (premium === null) return 'unknown';
  if (door === 'learning') return 'locked';
  if (conversationCompletedSinceLaunch === null) return 'unknown';
  return conversationCompletedSinceLaunch ? 'locked' : 'open';
};
