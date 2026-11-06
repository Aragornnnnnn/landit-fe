// 페이월 하단 결제 버튼과 그 밑 결제 안내 — 스토어 가격을 못 받았으면 결제 대신 다시 불러오기를 건다. 한 장 페이월과 단계형 페이월이 같이 쓴다
import type { PaywallPlan } from '@/features/subscription/model/product/plans';
import { Button } from '@/shared/ui/Button';

import { PurchaseNotices } from './PurchaseNotices';

/** 스토어 가격을 못 받았을 때 결제 버튼 대신 거는 다시 불러오기 */
export interface PriceRetry {
  label: string;
  onRetry: () => void;
}

interface PurchaseCtaProps {
  label: string;
  /** 결제 안내를 붙일 구독 플랜. 이용권은 안내가 없어 비운다 */
  plan?: PaywallPlan;
  busy: boolean;
  onPurchase: () => void;
  /** 있으면 결제 버튼과 안내 대신 다시 불러오기만 둔다 — 등록값을 보고 결제하지 않게 */
  priceRetry?: PriceRetry;
}

export const PurchaseCta = ({
  label,
  plan,
  busy,
  onPurchase,
  priceRetry,
}: PurchaseCtaProps) =>
  priceRetry ? (
    <Button onClick={priceRetry.onRetry} loading={busy}>
      {priceRetry.label}
    </Button>
  ) : (
    <>
      <Button onClick={onPurchase} loading={busy}>
        {label}
      </Button>
      {plan && <PurchaseNotices plan={plan} />}
    </>
  );
