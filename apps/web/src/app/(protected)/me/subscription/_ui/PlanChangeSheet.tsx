'use client';

// 플랜 변경 안내 시트 — 연간이 얼마나 저렴한지와 어디서 바꾸는지, 언제 적용되는지를 말하고 스토어 구독 화면으로 보낸다.
// 앱은 플랜을 바꿀 수 없다. BE가 상품 식별자를 주면 월간 사용자에게만 열고 문구를 플랜별로 나눈다
import { EVENTS, type SubscriptionState } from '@landit/analytics';

import { formatWon, YEARLY_PLAN } from '@/features/subscription/model/plans';
import type { StoreInfo } from '@/features/subscription/model/store-links';
import { track } from '@/shared/analytics';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface PlanChangeSheetProps {
  open: boolean;
  status: SubscriptionState;
  store: StoreInfo;
  onClose: () => void;
}

export const PlanChangeSheet = ({
  open,
  status,
  store,
  onClose,
}: PlanChangeSheetProps) => (
  <BottomSheet open={open} onClose={onClose}>
    <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
      플랜 변경
    </h2>
    <p className="mt-2 text-[14px] leading-6" style={{ color: '#666' }}>
      연간 플랜은 월 {formatWon(YEARLY_PLAN.monthlyPrice)}꼴로{' '}
      {YEARLY_PLAN.badge}요. 연 {formatWon(YEARLY_PLAN.price)}을 한 번에
      결제해요.
    </p>
    <ul
      className="mt-3 space-y-1.5 text-[13.5px] leading-6"
      style={{ color: '#666' }}
    >
      <li>· 변경은 {store.name} 구독 화면에서 할 수 있어요.</li>
      <li>
        · 월간에서 연간으로 바꾸면 바로 적용되고, 남은 월간 기간은 스토어가
        정산해요.
      </li>
      <li>· 연간에서 월간으로는 지금 기간이 끝난 뒤 적용돼요.</li>
    </ul>
    <div className="mt-5 grid gap-2">
      <Button
        type="button"
        onClick={() => {
          track(EVENTS.STORE_SUBSCRIPTION_TAPPED, {
            status,
            action: 'change_plan',
          });
          window.location.assign(store.manageUrl);
        }}
      >
        {store.name}에서 플랜 변경
      </Button>
      <Button type="button" variant="ghost" size="md" onClick={onClose}>
        닫기
      </Button>
    </div>
  </BottomSheet>
);
