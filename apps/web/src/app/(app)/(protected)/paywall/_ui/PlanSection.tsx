// 결제 칸 — 「플랜을 선택하세요」와 지금 플랜(월간·연간) 카드. 아래에 약관 링크·구매 복원. 결제·해지 안내는 하단 고정 CTA 밑에 있다.
// 환급 챌린지의 결제 칸은 결제 금액 안내(CheckoutStep)에 있다
import type { SubscriptionPlan } from '@landit/analytics';
import Link from 'next/link';

import {
  PLAN_ORDER,
  type PaywallPlan,
  type RegularPlan,
} from '@/features/subscription/model/product/plans';

import { PlanCard } from './PlanCard';
import { RevealSection } from './RevealSection';
import { Highlight, SectionHeading } from './SectionHeading';

interface PlanSectionProps {
  plans: Record<RegularPlan, PaywallPlan>;
  selectedId: SubscriptionPlan;
  onSelect: (id: SubscriptionPlan) => void;
  /** 약관 옆 구매 복원 — 맨 위 줄은 스크롤로 올라가니 여기에도 둔다 */
  onRestore: () => void;
  restoreDisabled: boolean;
}

export const PlanSection = ({
  plans,
  selectedId,
  onSelect,
  onRestore,
  restoreDisabled,
}: PlanSectionProps) => (
  <RevealSection className="pt-14">
    <SectionHeading
      title={
        <>
          <Highlight>플랜</Highlight>을 선택하세요
        </>
      }
    />
    {/* 결제가 걸린 조작부라 등장 연출을 걸지 않는다 — 연출이 멎어 흐린 채로 눌리면 안 된다 */}
    {/* 배지가 카드 위 테두리에 걸치니 그만큼 위를 띄운다 */}
    <div className="mt-5 flex gap-2.5 px-5 pt-2.5">
      {PLAN_ORDER.map((id) => (
        <PlanCard
          key={id}
          plan={plans[id]}
          selected={id === selectedId}
          onSelect={(plan) => onSelect(plan.id)}
        />
      ))}
    </div>
    <nav className="mt-5 flex justify-center gap-3 text-10 leading-[1.3] font-medium text-muted-foreground underline">
      <Link href="/terms">이용약관</Link>
      <Link href="/privacy">개인정보 처리방침</Link>
      <button
        type="button"
        onClick={onRestore}
        disabled={restoreDisabled}
        className="underline disabled:opacity-50"
      >
        구매 복원
      </button>
    </nav>
  </RevealSection>
);
