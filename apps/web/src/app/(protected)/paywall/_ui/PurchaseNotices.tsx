// 결제 버튼 밑 결제·해지 안내 두 줄 — 청구액·갱신·해지는 스토어 심사(3.1.2)가 결제 버튼 곁에서 확인한다. 한 장 페이월과 단계형 페이월(구독)이 같이 쓴다
import { useTranslations } from 'next-intl';

import type { PaywallPlan } from '@/features/subscription/model/product/plans';

import { getBillingNotice, getCancelNotice } from '../_model/paywall-copy';

/**
 * 안내 두 줄이 차지하는 높이 — 버튼만 있을 때(스크롤 아래 여백 +100px)보다 이만큼 더 둔다(+142px).
 * 여백 클래스는 safe-area 규칙 테스트가 스크롤 영역 줄에서 읽으므로 그 자리에 숫자로 적는다. 이 값을 바꾸면 그 142도 같이 바꾼다
 */
export const NOTICES_HEIGHT_PX = 42;

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
