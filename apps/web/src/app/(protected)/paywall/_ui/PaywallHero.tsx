// 페이월 상단 — 닫기 줄, 로고와 PREMIUM 배지, 캐릭터 단체샷.
// 단체샷은 아래 경계에서 허리쯤이 잘리도록 슬롯보다 큰 이미지를 넣고 넘치는 부분을 숨긴다 (피그마 '빼꼼 컷')
import Image from 'next/image';

import { PremiumBadge } from '@/features/subscription/ui/premium-brand';
import { CloseIcon } from '@/shared/ui/Icons';

interface PaywallHeroProps {
  onClose: () => void;
}

export const PaywallHero = ({ onClose }: PaywallHeroProps) => (
  <section className="shrink-0 bg-[linear-gradient(180deg,#fdf1e8,#fff8f2)] pt-[max(env(safe-area-inset-top),8px)]">
    <div className="flex h-10 items-center pl-4 short:h-8">
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="-ml-2 flex size-9 items-center justify-center rounded-full text-foreground transition-all active:scale-90 active:bg-black/5"
      >
        <CloseIcon size={24} />
      </button>
    </div>

    <div className="mt-1.5 flex justify-center">
      <PremiumBadge />
    </div>

    {/* 슬롯 높이가 곧 크롭선이다. 작은 폰에서는 슬롯을 조금 줄이고 이미지를 위로 당겨 얼굴은 남긴다 */}
    <div className="relative mt-1.5 h-[194px] overflow-hidden short:h-[184px]">
      <Image
        src="/images/paywall-hero.webp"
        alt=""
        width={1200}
        height={900}
        priority
        className="absolute top-[-14px] left-1/2 w-[calc(100%+10px)] max-w-none -translate-x-1/2 short:top-[-18px]"
      />
    </div>
  </section>
);
