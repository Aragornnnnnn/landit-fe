// 페이월 첫 화면 — 밝은 바탕에 로고와 PREMIUM 배지, 「프리미엄으로 이렇게 배워요」, 캐릭터 단체샷.
// 환급 챌린지의 첫 화면은 혜택 화면(BenefitsStep)에 있다. 처음부터 화면에 있으니 관찰 없이 마운트하자마자 animate-reveal-up으로 차례로 떠오른다
import type { CSSProperties } from 'react';
import Image from 'next/image';

import { PAYWALL_HERO } from '@/features/subscription/ui/paywall-hero-image';
import { PremiumBadge } from '@/features/subscription/ui/premium-brand';

export const PaywallHero = () => (
  // 위 여백 40px은 겹쳐 떠 있는 PaywallHeader의 줄 높이(h-10)다.
  // data-inview를 처음부터 켜 둬야 헤드라인 형광펜이 그어진다
  <section data-inview="true" className="text-center">
    <div className="bg-[linear-gradient(180deg,#fdf1e8,var(--color-background))] pt-[calc(max(var(--safe-area-inset-top),8px)+40px)]">
      <div
        className="animate-reveal-up relative mt-1.5 flex justify-center"
        style={{ '--i': 0 } as CSSProperties}
      >
        <PremiumBadge />
      </div>
    </div>

    <h2
      className="animate-reveal-up mt-5 px-6 text-[28px] leading-[38px] font-black tracking-[-0.025em] text-foreground"
      style={{ '--i': 1 } as CSSProperties}
    >
      <span className="relative isolate inline-block">
        <span
          aria-hidden="true"
          className="reveal-highlight absolute inset-x-[-3px] bottom-[4px] -z-10 h-[18px] rounded-[3px] bg-[#f9c99a]/70"
        />
        {/* 시나리오 대화는 무료에도 있어 「~에서만」을 쓰지 않는다 */}
        프리미엄으로
      </span>
      <br />
      이렇게 배워요
    </h2>

    {/* 캐릭터 단체샷 — 슬롯 높이가 곧 크롭선이라 허리쯤에서 잘린다(피그마 '빼꼼 컷') */}
    <div className="relative mt-4 h-[194px] overflow-hidden">
      <Image
        {...PAYWALL_HERO}
        alt=""
        priority
        className="absolute top-[-14px] left-1/2 w-[calc(100%+10px)] max-w-none -translate-x-1/2"
      />
    </div>
  </section>
);
