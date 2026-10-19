// 환급 페이월 2단계 — 결제 금액 안내. 무엇을 얼마에 사는지(정가를 지운 신규 회원 특가)와 돌려받는 길을 맨 위에 두고, 비교표·리뷰로 받친다.
// 한 화면 안에 가격과 혜택 정리가 함께 보이게 한다. 피그마 「결제 금액 안내 화면」(3540:322)
import Image from 'next/image';

import { Coin } from '@/features/reward/ui/common/Coin';
import { formatWon } from '@/features/subscription/lib/won';
import { PAYWALL_HERO } from '@/features/subscription/ui/paywall-hero-image';
import { PremiumBadge } from '@/features/subscription/ui/premium-brand';
import { BenefitComparison } from '@/features/subscription/ui/product/BenefitComparison';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

import { discountPercentOf, listPriceOf } from '../_model/pass-price';
import { rewardBenefitsOf, type RewardPlan } from '../_model/paywall-content';
import { ReviewSection } from './ReviewSection';

const PassPriceCard = ({ plan }: { plan: RewardPlan }) => {
  const listPrice = listPriceOf(plan.price);

  return (
    <div className="rounded-[22px] border border-[#ece6de] bg-card px-5 py-[18px] shadow-[0_6px_18px_rgba(51,31,13,0.06)]">
      <p className="text-base font-bold text-foreground">
        {plan.days}일 프리미엄 이용권
      </p>
      <p className="mt-3 text-[15px] font-medium text-[#b1aaa3] line-through">
        {formatWon(listPrice)}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black whitespace-nowrap text-primary">
          {discountPercentOf(plan.price, listPrice)}%
        </span>
        <span className="text-[28px] font-black whitespace-nowrap text-foreground tabular-nums">
          {formatWon(plan.price)}
        </span>
        <span className="shrink-0 rounded-md bg-destructive px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-white">
          신규 회원 특가
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-[#f1ebe3] pt-3">
        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-[#f4efe8] px-2 py-1 text-xs font-bold text-[#5f5953]">
          <Emoji>🎁</Emoji>
          덤으로 환급 이벤트 진행 중
        </span>
        <p className="flex items-center gap-2 text-sm font-medium text-[#5f5953]">
          <Coin size={22} />
          <span>
            매일 하면{' '}
            <span className="font-black text-primary">
              낸 돈 다 돌려받을 수 있어요
            </span>
          </span>
        </p>
      </div>
    </div>
  );
};

export const CheckoutStep = ({
  plan,
  onBack,
}: {
  plan: RewardPlan;
  onBack: () => void;
}) => (
  <>
    <section
      data-inview="true"
      className="relative bg-[linear-gradient(180deg,#fdf1e8,var(--color-background))] pt-[max(var(--safe-area-inset-top),8px)] text-center"
    >
      <div className="flex h-10 items-center pl-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex size-9 items-center justify-center rounded-full text-foreground active:bg-black/5"
        >
          <ChevronLeftIcon size={26} />
        </button>
      </div>
      <div className="flex justify-center">
        <PremiumBadge />
      </div>
      <h2 className="mt-3 text-[26px] font-black tracking-[-0.025em] text-foreground">
        {plan.days}일 프리미엄 이용권
      </h2>
      {/* 캐릭터 단체샷 — 팔을 기댄 선에서 잘라 아래 흰 판이 받친다 */}
      <div className="relative mt-3 h-[200px] overflow-hidden">
        <Image
          {...PAYWALL_HERO}
          alt=""
          priority
          className="absolute top-0 left-1/2 w-[calc(100%+10px)] max-w-none -translate-x-1/2"
        />
      </div>
    </section>

    <div
      data-inview="true"
      className="rounded-t-[28px] bg-card px-5 pt-6 pb-8 shadow-[0_-6px_18px_rgba(51,31,13,0.06)]"
    >
      <PassPriceCard plan={plan} />

      <section className="mt-9">
        <h3 className="text-[22px] font-black tracking-[-0.02em] text-foreground">
          프리미엄이면 이게 다 열려요
        </h3>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">
          매일 하는 대화를 프리미엄이 끝까지 챙겨 줘요
        </p>
        <div className="mt-4 rounded-3xl border border-[#e9e7e2] bg-card pt-1 pb-4">
          <BenefitComparison benefits={rewardBenefitsOf(plan.dailyRefund)} />
        </div>
      </section>
    </div>

    <div className="-mt-6 pb-4">
      <ReviewSection rewardChallenge />
    </div>
  </>
);
