// 페이월 게이트 판정 — 무료로 열어 둘 구간과 잠글 순간, 잠글 수 없는 환경을 한 곳에서 정한다.
// 잠금은 학습 진입 지점에서만 건다. 화면 전체를 막지 않는다 (docs/subscription.md)
import { isAppVersionAtLeast } from './app-version';

// 결제 브릿지가 실린 첫 앱 릴리즈 — 이보다 낮은 셸과 브라우저(appVersion 없음)에는 결제 시트를 띄울 수 없으니 잠그지 않는다
export const PAYWALL_MIN_APP_VERSION = '1.3.0';

export interface PaywallGateInput {
  // NEXT_PUBLIC_PAYMENT_ENABLED — 심사 기간과 오픈 시점을 가르는 웹 플래그
  paymentEnabled: boolean;
  // 셸이 주입한 앱 버전. 브라우저면 null
  appVersion: string | null;
  // 아직 못 받았으면 null — 모르는 채로 잠그지 않는다
  premium: boolean | null;
  // 결제 오픈일 이후 대화를 하나 끝냈는가. 신규는 첫 대화, 기존 사용자는 오픈 뒤 첫 대화가 여기 걸린다
  conversationCompletedSinceLaunch: boolean | null;
}

// open: 그냥 들어간다 / locked: 페이월로 보낸다 / unknown: 판단 재료가 오는 중이라 잠시 보류
export type PaywallGateDecision = 'open' | 'locked' | 'unknown';

export const decidePaywallGate = ({
  paymentEnabled,
  appVersion,
  premium,
  conversationCompletedSinceLaunch,
}: PaywallGateInput): PaywallGateDecision => {
  // 잠글 수 없는 환경이 먼저 — 결제가 안 되는 곳에서 막으면 사용자가 갈 데가 없다
  if (!paymentEnabled) return 'open';
  if (!appVersion || !isAppVersionAtLeast(appVersion, PAYWALL_MIN_APP_VERSION))
    return 'open';

  if (premium === true) return 'open';
  if (premium === null || conversationCompletedSinceLaunch === null)
    return 'unknown';

  // 무료 구간 — 오픈 뒤 대화 하나까지. 그 뒤 표현 학습부터 잠긴다
  return conversationCompletedSinceLaunch ? 'locked' : 'open';
};
