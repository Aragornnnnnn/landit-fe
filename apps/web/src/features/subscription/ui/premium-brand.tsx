// 프리미엄 브랜드 조각 — 골드 그라데이션과 "landit PREMIUM" 배지. 페이월 상단·마이페이지 카드·구독 관리 화면이 같은 모양을 쓴다
import { LanditLogo } from '@/shared/ui/LanditLogo';

export const GOLD_GRADIENT = 'linear-gradient(90deg, #e0a63a, #f7cf5c)';

// 골드 면 위에서는 배지를 반투명 흰색으로 — 골드 위에 골드는 묻힌다
const BADGE_ON_GOLD = 'rgba(255, 255, 255, 0.55)';

interface PremiumPillProps {
  /** md는 로고 옆 배지, sm은 비교표 머리글처럼 좁은 칸에 들어가는 크기 */
  size?: 'md' | 'sm';
  /** 골드 면 위에 놓이는가 */
  onGold?: boolean;
}

const PILL_SIZE: Record<NonNullable<PremiumPillProps['size']>, string> = {
  md: 'px-[11px] py-1 text-[13px]',
  sm: 'px-2 py-[3px] text-[10px]',
};

/** "PREMIUM" 골드 알약 하나 — 화면에서 프리미엄을 뜻하는 색은 이것 하나다 */
export const PremiumPill = ({
  size = 'md',
  onGold = false,
}: PremiumPillProps) => (
  <span
    className={`inline-block rounded-full leading-[1.2] font-bold tracking-[0.12em] text-[#4a2f00] ${PILL_SIZE[size]}`}
    style={{ background: onGold ? BADGE_ON_GOLD : GOLD_GRADIENT }}
  >
    PREMIUM
  </span>
);

interface PremiumBadgeProps {
  /** 로고 높이(px). 페이월은 37.5, 카드는 20 */
  logoHeight?: number;
  /** 골드 면 위에 놓이는가 */
  onGold?: boolean;
}

/** 로고와 PREMIUM 알약을 나란히 — 페이월 상단, 마이페이지 골드 카드, 구독 관리가 쓴다 */
export const PremiumBadge = ({
  logoHeight = 37.5,
  onGold = false,
}: PremiumBadgeProps) => (
  <div className="flex items-center gap-2.5">
    {/* 흰 점은 스플래시 연출용 덮개라 여기선 숨겨 주황 점이 보이게 한다 */}
    <span className="flex" style={{ height: logoHeight }}>
      <LanditLogo className="h-full w-auto text-foreground [&_.logo-dot-splash]:hidden" />
    </span>
    <PremiumPill onGold={onGold} />
  </div>
);
