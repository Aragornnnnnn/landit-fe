'use client';

// 지금 파는 환급 챌린지의 값 — 셸이 준 이용권 가격으로 하루 몫과 최대 환급액을 정한다. 페이월과 같은 금액을 말하려고 같은 가격을 본다.
// 구독(스토어 가격)과 환급(산식) 두 도메인을 함께 봐야 해서 라우트 층에 둔다
import { rewardOfferOf } from '@/features/reward/model/refund-offer';
import {
  PASS_FALLBACK_PRICE,
  toKrwPrices,
} from '@/features/subscription/model/product/offering';
import { useOffering } from '@/features/subscription/model/product/useOffering';

/**
 * @param enabled 꺼 두면 셸에 가격을 묻지 않고 등록값으로 말한다 — 환급을 권할 사람이 아니면 물을 까닭이 없다
 */
export const useRewardOffer = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  const offering = useOffering({ enabled });
  // 가격을 못 받았으면(브라우저·구버전 셸) 등록값으로 말한다
  return rewardOfferOf(
    toKrwPrices(offering.regular).pass ?? PASS_FALLBACK_PRICE,
  );
};
