// 스토어별 구독 관리 정보 — 구독은 스토어가 갖고 있어 앱은 그 화면으로 보내기만 한다.
// 셸은 웹 도메인 밖 주소를 OS로 넘기므로(apps/mobile isExternalNavigation) 브릿지 메시지 없이 링크로 충분하다

export type StorePlatform = 'ios' | 'android';

export interface StoreInfo {
  name: string;
  /** 구독을 해지하거나 해지를 취소하는 스토어 화면 */
  manageUrl: string;
}

export const STORE: Record<StorePlatform, StoreInfo> = {
  ios: {
    name: 'App Store',
    manageUrl: 'https://apps.apple.com/account/subscriptions',
  },
  android: {
    name: 'Google Play',
    manageUrl: 'https://play.google.com/store/account/subscriptions',
  },
};
