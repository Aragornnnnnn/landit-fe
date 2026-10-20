// 환급 페이월 2단계 — 결제 금액 안내. 예전 한 페이지 페이월처럼 로고와 캐릭터, 무료 vs 프리미엄 표, 고를 것 없는 100일 이용권 카드 한 장을
// 한 화면에 담는다. 혜택 설명은 앞 화면에서 했으니 여기선 무엇을 얼마에 사는지만 또렷하게. 피그마 「결제 금액 안내 v4」(3563:322)
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Coin } from '@/features/reward/ui/common/Coin';
import { formatWon } from '@/features/subscription/lib/won';
import {
  discountPercentOf,
  listPriceOf,
} from '@/features/subscription/model/product/pass-price';
import { PAYWALL_HERO } from '@/features/subscription/ui/paywall-hero-image';
import { PremiumBadge } from '@/features/subscription/ui/premium-brand';
import { BenefitComparison } from '@/features/subscription/ui/product/BenefitComparison';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

import { rewardBenefitsOf, type RewardPlan } from '../_model/paywall-content';

/** 캐릭터 그림 높이 — 기본(그림 너비 257px)과, 긴 화면에서 키울 수 있는 끝 */
const HERO_MIN_PX = 131;
const HERO_MAX_PX = 180;
/** 그림 밖 내용 높이 — 위아래 안전 영역 기본값(8px·12px)을 뺀 나머지 전부(헤더·로고·표·이용권 카드·약관·버튼 자리) */
const HERO_REST_PX = 614;
/** 계산이 조금 어긋나도 스크롤이 생기지 않게 남기는 여유 */
const HERO_SPARE_PX = 16;

const PassCard = ({ plan }: { plan: RewardPlan }) => {
  const listPrice = listPriceOf(plan.price);

  return (
    // 고를 것이 이용권 하나뿐이라 처음부터 골라 둔 모양으로 그린다 — 플랜 카드의 선택 상태와 같은 테두리·바탕
    <div className="rounded-[20px] border-2 border-primary bg-[#fffcf8] px-4 py-3 shadow-[0_6px_16px_rgba(224,122,58,0.12)]">
      <p className="flex items-center gap-1.5">
        <span className="text-[15px] font-bold text-[#c4601f]">
          {plan.days}일 프리미엄 이용권
        </span>
        <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
          신규 회원 특가
        </span>
      </p>
      {/* 원가·할인율·판매가를 한 줄에 — 카드 높이를 줄여 작은 폰에서도 환급 줄까지 버튼 위에 보이게 */}
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[13px] font-medium text-[#b1aaa3] line-through">
          {formatWon(listPrice)}
        </span>
        <span className="text-lg font-black text-primary">
          {discountPercentOf(plan.price, listPrice)}%
        </span>
        <span className="text-[22px] font-black text-foreground tabular-nums">
          {formatWon(plan.price)}
        </span>
      </p>
      <p className="mt-2 flex items-center gap-1.5 border-t border-[#f1ebe3] pt-2 text-[13px] font-medium text-[#5f5953]">
        <Coin size={18} />
        꾸준히 하면 결제한 {formatWon(plan.price)}도 돌려받아요
      </p>
    </div>
  );
};

export const CheckoutStep = ({
  plan,
  onBack,
  onRestore,
  restoreDisabled,
}: {
  plan: RewardPlan;
  onBack: () => void;
  onRestore: () => void;
  restoreDisabled: boolean;
}) => (
  <div data-inview="true">
    <section className="bg-[linear-gradient(180deg,#fdf1e8,var(--color-background))] pt-[max(var(--safe-area-inset-top),8px)]">
      <div className="flex h-10 items-center justify-between pr-5 pl-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex size-9 items-center justify-center rounded-full text-foreground active:bg-black/5"
        >
          <ChevronLeftIcon size={26} />
        </button>
        {/* 스토어 심사가 요구하는 구매 복원 진입점 — 결제가 일어나는 화면에도 둔다 */}
        <button
          type="button"
          onClick={onRestore}
          disabled={restoreDisabled}
          className="text-[13px] leading-none text-muted-foreground disabled:opacity-50"
        >
          구매 복원
        </button>
      </div>
      {/* 앞 화면과 같은 크기의 로고 — 화면이 넘어가도 같은 페이월 안이라는 게 이어 보이게 */}
      {/* 낮은 화면에선 로고를 80%로 줄인다 — 레이아웃 자리까지 같이 줄도록 transform이 아니라 zoom */}
      <div className="flex justify-center pt-1.5 short:[zoom:0.8]">
        <PremiumBadge />
      </div>
      {/* 캐릭터 단체샷 — 자르지 않고 줄여서, 팔을 기댄 선이 아래 표 카드 윗선에 오게 한다. 낮은 화면은 같은 비율로 80%.
          긴 화면은 남는 높이만큼 키운다 — 그림 밖 내용이 HERO_REST_PX라 그만큼 빼고, 스크롤이 생기지 않게 16px 여유를 둔다.
          너비가 화면을 넘지 않게 180px에서 멈춘다(그때 너비 353px) */}
      <div
        className="relative mt-3 h-(--hero-h) overflow-hidden short:mt-2 short:h-[104px]"
        style={
          {
            '--hero-h': `clamp(${HERO_MIN_PX}px, calc(100dvh - ${HERO_REST_PX + HERO_SPARE_PX}px - max(var(--safe-area-inset-top), 8px) - max(var(--safe-area-inset-bottom), 12px)), ${HERO_MAX_PX}px)`,
          } as CSSProperties
        }
      >
        <Image
          {...PAYWALL_HERO}
          alt=""
          priority
          className="absolute top-0 left-1/2 w-[calc(var(--hero-h)*257/131)] max-w-none -translate-x-1/2 short:w-[204px]"
        />
      </div>
    </section>

    <div className="px-5">
      <div className="rounded-3xl border border-[#e9e7e2] bg-card pt-1 pb-3 shadow-[0_2px_5px_rgba(51,38,26,0.05)]">
        <BenefitComparison
          benefits={rewardBenefitsOf(plan.dailyRefund)}
          pillar={false}
        />
      </div>
      <div className="mt-3.5">
        <PassCard plan={plan} />
      </div>
    </div>
    {/* 약관은 버튼 밑이 아니라 페이지 맨 아래에 — 결제 버튼 둘레를 가볍게 두고, 내려 보면 찾을 수 있게 */}
    <nav className="mt-6 flex justify-center gap-3 text-[11px] leading-[1.3] font-medium text-muted-foreground underline">
      <Link href="/terms">이용약관</Link>
      <Link href="/privacy">개인정보 처리방침</Link>
    </nav>
  </div>
);
