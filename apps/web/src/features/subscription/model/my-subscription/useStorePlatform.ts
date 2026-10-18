'use client';

// 구독 관리 링크를 열 스토어 — 결제 스토어(BE)가 우선, 없으면 셸 플랫폼, 브라우저는 iOS (resolveStorePlatform)
import { useNativeContext } from '@/shared/bridge/useNativeContext';

import type { MySubscription } from '../../api/subscription';
import { resolveStorePlatform, type StorePlatform } from './store-links';

/**
 * 구독 관리·해지 화면이 보낼 스토어를 정한다.
 *
 * @param paidStore BE가 준 결제 스토어. 모르면 셸 플랫폼을 쓴다
 */
export const useStorePlatform = (
  paidStore: MySubscription['store'] | undefined,
): StorePlatform => {
  const context = useNativeContext();
  return resolveStorePlatform(paidStore, context?.platform);
};
