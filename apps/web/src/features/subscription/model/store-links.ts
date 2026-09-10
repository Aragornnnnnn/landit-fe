// 스토어별 구독 관리·환불 정보 — 구독은 스토어가 갖고 있어 앱은 그 화면으로 보내기만 한다.
// 셸은 웹 도메인 밖 주소를 OS로 넘기므로(apps/mobile isExternalNavigation) 브릿지 메시지 없이 링크로 충분하다

export type StorePlatform = 'ios' | 'android';

export interface StoreInfo {
  name: string;
  /** 구독 해지·플랜 변경을 하는 스토어 화면 */
  manageUrl: string;
  /** 환불을 요청하는 스토어 화면 — 앱 안에서는 환불을 처리하지 않는다 */
  refundUrl: string;
  /** 환불 안내 문장에서 링크가 되는 부분 */
  refundLabel: string;
}

export const STORE: Record<StorePlatform, StoreInfo> = {
  ios: {
    name: 'App Store',
    manageUrl: 'https://apps.apple.com/account/subscriptions',
    refundUrl: 'https://reportaproblem.apple.com',
    refundLabel: '애플 문제 신고 페이지',
  },
  android: {
    name: 'Google Play',
    manageUrl: 'https://play.google.com/store/account/subscriptions',
    refundUrl: 'https://support.google.com/googleplay/answer/2479637',
    refundLabel: '구글 환불 요청 안내',
  },
};
