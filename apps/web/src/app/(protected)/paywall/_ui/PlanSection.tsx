// 결제 칸 — 환급 챌린지가 켜지면 고를 것 없이 결제 요약 한 장(「100일 동안 모은 만큼 돌려받아요」), 꺼져 있으면 「플랜을 선택하세요」와 지금 플랜(월간·연간) 카드. 아래에 약관 링크·구매 복원. 결제·해지 안내는 하단 고정 CTA 밑에 있다
import type { SubscriptionPlan } from '@landit/analytics';
import Link from 'next/link';

import {
  PLAN_ORDER,
  type PaywallPlan,
  type RegularPlan,
} from '@/features/subscription/model/product/plans';

import type { RewardPlan } from '../_model/paywall-content';
import { PlanCard } from './PlanCard';
import { RevealSection } from './RevealSection';
import { RewardSummaryCard } from './RewardSummaryCard';
import { Highlight, SectionHeading } from './SectionHeading';

interface PlanSectionProps {
  plans: Record<RegularPlan, PaywallPlan>;
  /** 환급 플랜(100일) 값 — 환급 챌린지가 켜졌을 때만 그린다 */
  rewardPlan: RewardPlan;
  selectedId: SubscriptionPlan;
  onSelect: (id: SubscriptionPlan) => void;
  /** 환급 챌린지가 켜졌는가 */
  rewardChallenge: boolean;
  /** 약관 옆 구매 복원 — 맨 위 줄은 스크롤로 올라가니 여기에도 둔다 */
  onRestore: () => void;
  restoreDisabled: boolean;
}

export const PlanSection = ({
  plans,
  rewardPlan,
  selectedId,
  onSelect,
  rewardChallenge,
  onRestore,
  restoreDisabled,
}: PlanSectionProps) => (
  <RevealSection className="pt-14">
    <SectionHeading
      title={
        rewardChallenge ? (
          <>
            {rewardPlan.days}일 동안
            <br />
            <Highlight>모은 만큼</Highlight> 돌려받아요
          </>
        ) : (
          <>
            <Highlight>플랜</Highlight>을 선택하세요
          </>
        )
      }
    />
    {/* 결제가 걸린 조작부라 등장 연출을 걸지 않는다 — 연출이 멎어 흐린 채로 눌리면 안 된다 */}
    {rewardChallenge ? (
      <div className="mt-5 px-5">
        <RewardSummaryCard plan={rewardPlan} />
      </div>
    ) : (
      <>
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
      </>
    )}
    <nav className="mt-5 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline">
      <Link href="/terms">이용약관</Link>
      <Link href="/privacy">개인정보 처리방침</Link>
      {/* 환급 챌린지는 구독이 아니라 아래 복원 링크를 두지 않는다 — 맨 위 오른쪽의 구매 복원으로 충분하다 */}
      {!rewardChallenge && (
        <button
          type="button"
          onClick={onRestore}
          disabled={restoreDisabled}
          className="underline disabled:opacity-50"
        >
          구매 복원
        </button>
      )}
    </nav>
  </RevealSection>
);
