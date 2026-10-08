// 「플랜을 선택하세요」 — 플랜 카드 두 장과 약관 링크·구매 복원. 환급 챌린지가 켜지면 환급률을 앞세운 세로 카드, 꺼져 있으면 지금 플랜(월간·연간) 카드. 결제·해지 안내는 하단 고정 CTA 밑에 있다
import type { SubscriptionPlan } from '@landit/analytics';
import Link from 'next/link';

import {
  PLAN_ORDER,
  type PaywallPlan,
} from '@/features/subscription/model/product/plans';

import { PlanCard } from './PlanCard';
import { RefundPlanCard } from './RefundPlanCard';
import { RevealSection } from './RevealSection';
import { Highlight, SectionHeading } from './SectionHeading';

interface PlanSectionProps {
  plans: Record<SubscriptionPlan, PaywallPlan>;
  selectedId: SubscriptionPlan;
  onSelect: (plan: PaywallPlan) => void;
  /** 환급 챌린지가 켜졌는가 */
  refundChallenge: boolean;
  /** 약관 옆 구매 복원 — 맨 위 줄은 스크롤로 올라가니 여기에도 둔다 */
  onRestore: () => void;
  restoreDisabled: boolean;
}

export const PlanSection = ({
  plans,
  selectedId,
  onSelect,
  refundChallenge,
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
    {refundChallenge ? (
      <>
        <p className="mt-2 px-6 text-[15px] text-muted-foreground">
          프리미엄과 함께 매일 챌린지에 도전하고,
          <br />
          결제한 돈도 돌려받아 보세요
        </p>
        <div className="mt-5 flex flex-col gap-3 px-5">
          {/* 전액 환급(6개월)을 위에 — 가장 센 제안이 먼저 눈에 든다 */}
          {[...PLAN_ORDER].reverse().map((id) => (
            <RefundPlanCard
              key={id}
              plan={plans[id]}
              selected={id === selectedId}
              onSelect={onSelect}
              featured={id === 'yearly'}
            />
          ))}
        </div>
      </>
    ) : (
      <>
        {/* 배지가 카드 위 테두리에 걸치니 그만큼 위를 띄운다 */}
        <div className="mt-5 flex gap-2.5 px-5 pt-2.5">
          {PLAN_ORDER.map((id) => (
            <PlanCard
              key={id}
              plan={plans[id]}
              selected={id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </>
    )}
    <nav className="mt-5 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline">
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
