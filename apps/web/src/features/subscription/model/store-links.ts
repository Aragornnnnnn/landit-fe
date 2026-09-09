// 스토어 구독 관리·환불 페이지 주소 — 구독은 스토어가 갖고 있어 앱은 그 화면으로 보내기만 한다.
// 셸은 웹 도메인 밖 주소를 OS로 넘기므로(apps/mobile isExternalNavigation) 브릿지 메시지 없이 링크로 충분하다

export type StorePlatform = 'ios' | 'android';

export const STORE_NAME: Record<StorePlatform, string> = {
  ios: 'App Store',
  android: 'Google Play',
};

/** 구독 해지·플랜 변경을 하는 스토어 화면 */
export const SUBSCRIPTION_MANAGEMENT_URL: Record<StorePlatform, string> = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
};

/** 환불을 요청하는 스토어 화면 — 앱 안에서는 환불을 처리하지 않는다 */
export const REFUND_REQUEST_URL: Record<StorePlatform, string> = {
  ios: 'https://reportaproblem.apple.com',
  android: 'https://support.google.com/googleplay/answer/2479637',
};
