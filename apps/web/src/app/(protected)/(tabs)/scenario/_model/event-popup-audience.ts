// 이벤트 공지를 띄울 사람 — 정기 구독(월간·연간·3개월·6개월) 중인 사람만 빼고, 100일 이용권·무료·받은 기간 사용자에게는 띄운다
import type { MySubscription } from '@/features/subscription/api/subscription';
import { planFromProductId } from '@/features/subscription/model/product/plans';

export const isEventPopupAudience = (subscription: MySubscription) => {
  if (!subscription.premium) return true;
  const plan = planFromProductId(subscription.productId);
  // 플랜을 모르면(대시보드 프로모션 부여) 구독이 아니라 받은 기간이다
  return plan === null || plan === 'pass';
};
