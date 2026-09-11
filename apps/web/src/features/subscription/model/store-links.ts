// 스토어별 구독 관리 정보 — 구독은 스토어가 갖고 있어 앱은 그 화면으로 보내기만 한다.
// 셸은 웹 도메인 밖 주소를 OS로 넘기므로(apps/mobile isExternalNavigation) 브릿지 메시지 없이 링크로 충분하다

import type { SubscriptionStore } from '../api/subscription';

export type StorePlatform = 'ios' | 'android';

/**
 * 구독 관리 링크를 어느 스토어로 열지. BE가 준 결제 스토어가 우선이고(아이패드·기기 변경에도 맞다),
 * 없거나 애플·구글이 아니면(프로모션·테스트) 셸 플랫폼, 그것도 없으면 iOS
 */
export const resolveStorePlatform = (
  store: SubscriptionStore | null | undefined,
  platform: StorePlatform | null | undefined,
): StorePlatform => {
  if (store === 'APP_STORE' || store === 'MAC_APP_STORE') return 'ios';
  if (store === 'PLAY_STORE') return 'android';
  return platform ?? 'ios';
};

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
