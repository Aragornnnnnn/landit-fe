'use client';

// 구독 관리 링크를 열 스토어 — 결제 스토어(BE)가 우선, 없으면 셸 플랫폼, 브라우저는 iOS (resolveStorePlatform)
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

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
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  return resolveStorePlatform(paidStore, context?.platform);
};
