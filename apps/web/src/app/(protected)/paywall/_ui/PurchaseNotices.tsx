// 결제 버튼 밑 결제·해지 안내 두 줄 — 청구액·갱신·해지는 스토어 심사(3.1.2)가 결제 버튼 곁에서 확인한다. 한 장 페이월과 단계형 페이월(구독)이 같이 쓴다
import { useTranslations } from 'next-intl';

import type { PaywallPlan } from '@/features/subscription/model/product/plans';

import { getBillingNotice, getCancelNotice } from '../_model/paywall-copy';

/** 안내 두 줄이 차지하는 높이 — 버튼만 있을 때보다 이만큼 더 아래 여백이 필요하다 */
export const NOTICES_HEIGHT_PX = 42;

/** 하단 고정 CTA가 가리는 만큼의 스크롤 아래 여백 — 버튼만(100px)과 버튼+안내(100+42px). 마지막 내용이 버튼 뒤에 깔리지 않게 */
export const SCROLL_PADDING = {
  buttonOnly: 'pb-[calc(max(var(--safe-area-inset-bottom),12px)+100px)]',
  withNotices: 'pb-[calc(max(var(--safe-area-inset-bottom),12px)+142px)]',
} as const;

export const PurchaseNotices = ({ plan }: { plan: PaywallPlan }) => {
  const t = useTranslations('paywall');
  const notices = [getBillingNotice(plan, t), getCancelNotice(plan, t)];
  return (
    <>
      {notices.map((notice, index) => (
        <p
          key={notice}
          className={`${index === 0 ? 'mt-3' : 'mt-1'} text-center text-11 leading-[1.35] text-muted-foreground`}
        >
          {notice}
        </p>
      ))}
    </>
  );
};
