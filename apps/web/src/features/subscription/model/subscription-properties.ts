// 구독 상태를 앰플리튜드 유저 속성으로 접는다 — 유료 여부·상태·플랜 셋이다.
// 마이페이지 카드와 같은 판정(summarizeSubscription)을 쓴다. 지표와 화면이 다른 말을 하지 않도록
import type { UserPropertyPatch } from '@landit/analytics';

import type { MySubscription } from '../api/subscription';
import { summarizeSubscription } from './subscription-summary';

/** 구독 상태를 아직 모르는 구간 — 지난 세션에 쌓인 값을 지우고 모른다고만 남긴다 */
export const UNKNOWN_SUBSCRIPTION_PROPERTIES: UserPropertyPatch = {
  is_premium: null,
  subscription_state: 'unknown',
  plan: null,
};

export const toSubscriptionProperties = (
  subscription: MySubscription | null,
): UserPropertyPatch => {
  const summary = summarizeSubscription(subscription);
  if (summary.kind === 'none') {
    return { is_premium: false, subscription_state: 'none', plan: null };
  }
  return {
    is_premium: true,
    subscription_state: summary.kind,
    plan: summary.plan,
  };
};
