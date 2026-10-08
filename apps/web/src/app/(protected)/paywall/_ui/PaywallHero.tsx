// 페이월 첫 화면 — 환급 챌린지가 켜지면 어두운 무대 위에 로고와 PREMIUM 배지, 노란 스포트라이트와 반짝이 아래 돈·메인 문구와 6개월 성과 카드(RefundStage).
// 꺼져 있으면 무대 없이 밝은 바탕에 로고, 「프리미엄으로 이렇게 배워요」, 캐릭터 단체샷. 켜져 있으면 무대 아래 「프리미엄에서만 할 수 있는 것들」이 본문을 연다.
// 처음부터 화면에 있으니 관찰 없이 마운트하자마자 animate-reveal-up으로 차례로 떠오른다
import type { CSSProperties } from 'react';
import Image from 'next/image';

import { PAYWALL_HERO } from '@/features/subscription/ui/paywall-hero-image';
import { PremiumBadge } from '@/features/subscription/ui/premium-brand';

import { RefundStage } from './RefundStage';

/** 무대 반짝이 — 위치·크기·깜빡이는 시점 */
const SPARKLES = [
  { top: 92, left: '12%', size: 5, delay: 0 },
  { top: 150, left: '86%', size: 6, delay: 0.5 },
  { top: 330, left: '8%', size: 4, delay: 1.1 },
  { top: 410, left: '90%', size: 5, delay: 0.3 },
  { top: 520, left: '18%', size: 6, delay: 0.8 },
  { top: 600, left: '80%', size: 4, delay: 1.4 },
  { top: 250, left: '72%', size: 3, delay: 0.2 },
  { top: 680, left: '45%', size: 3, delay: 1.0 },
];

const Badge = ({ dark }: { dark: boolean }) => (
  <div
    className={`animate-reveal-up relative mt-1.5 flex justify-center ${dark ? '[&_svg]:text-white' : ''}`}
    style={{ '--i': 0 } as CSSProperties}
  >
    <PremiumBadge />
  </div>
);

export const PaywallHero = ({
  refundChallenge,
}: {
  /** 환급 챌린지가 켜졌는가 — 켜지면 어두운 환급 무대, 꺼지면 밝은 머리 */
  refundChallenge: boolean;
}) => (
  // 위 여백 40px은 겹쳐 떠 있는 PaywallHeader의 줄 높이(h-10)다.
  // data-inview를 처음부터 켜 둬야 헤드라인 형광펜이 그어진다
  <section data-inview="true" className="text-center">
    {/* 환급 무대 — 가장자리로 갈수록 더 어두워진다. 겹쳐 뜬 헤더 밑까지 깔린다 */}
    {refundChallenge ? (
      <div className="relative overflow-hidden bg-[radial-gradient(110%_75%_at_50%_28%,#2b2112_0%,#17120c_50%,#0c0a08_100%)] pt-[calc(max(var(--safe-area-inset-top),8px)+40px)] pb-8">
        {/* 스포트라이트 — 위 가운데에서 노란 빛줄기가 아래로 넓게 퍼져 돈과 메인 문구를 비춘다.
            빛줄기는 안쪽에서 모양을 자르고 바깥에서 흐려야 가장자리가 부드럽다(한 요소면 흐린 뒤 잘려 각진다) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-[780px] w-[460px] -translate-x-1/2 blur-[26px]"
        >
          <div className="size-full bg-[linear-gradient(180deg,rgba(255,214,110,0.55)_0%,rgba(255,206,84,0.2)_60%,transparent_100%)] [clip-path:polygon(40%_0,60%_0,100%_100%,0_100%)]" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[560px] left-1/2 h-[220px] w-[440px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,206,84,0.22),transparent)]"
        />
        {/* 반짝이 — 무대 곳곳에서 깜빡인다 */}
        {SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="animate-twinkle pointer-events-none absolute rounded-[1px] bg-white shadow-[0_0_10px_3px_rgba(255,255,255,0.8)]"
            style={{
              top: sparkle.top,
              left: sparkle.left,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: `${sparkle.delay}s`,
            }}
          />
        ))}

        <Badge dark />

        <RefundStage />
      </div>
    ) : (
      <div className="bg-[linear-gradient(180deg,#fdf1e8,var(--color-background))] pt-[calc(max(var(--safe-area-inset-top),8px)+40px)]">
        <Badge dark={false} />
      </div>
    )}

    <h2
      className={`animate-reveal-up px-6 text-[28px] leading-[38px] font-black tracking-[-0.025em] text-foreground ${refundChallenge ? 'mt-14' : 'mt-5'}`}
      style={{ '--i': refundChallenge ? 5 : 1 } as CSSProperties}
    >
      <span className="relative isolate inline-block">
        <span
          aria-hidden="true"
          className="reveal-highlight absolute inset-x-[-3px] bottom-[4px] -z-10 h-[18px] rounded-[3px] bg-[#f9c99a]/70"
        />
        {refundChallenge ? '프리미엄에서만' : '프리미엄으로'}
      </span>
      <br />
      {/* 시나리오 대화는 무료에도 있어, 환급 무대가 없는 화면에선 「~에서만」을 쓰지 않는다 */}
      {refundChallenge ? '할 수 있는 것들' : '이렇게 배워요'}
    </h2>

    {/* 캐릭터 단체샷 — 환급 무대가 없을 때만. 슬롯 높이가 곧 크롭선이라 허리쯤에서 잘린다(피그마 '빼꼼 컷') */}
    {!refundChallenge && (
      <div className="relative mt-4 h-[194px] overflow-hidden">
        <Image
          {...PAYWALL_HERO}
          alt=""
          priority
          className="absolute top-[-14px] left-1/2 w-[calc(100%+10px)] max-w-none -translate-x-1/2"
        />
      </div>
    )}
  </section>
);
