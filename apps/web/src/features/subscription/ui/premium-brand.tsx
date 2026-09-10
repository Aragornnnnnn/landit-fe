// 프리미엄 브랜드 조각 — 골드 그라데이션과 "landit PREMIUM" 배지. 페이월 상단·마이페이지 카드·구독 관리 화면이 같은 모양을 쓴다
import { LanditLogo } from '@/shared/ui/LanditLogo';

export const GOLD_GRADIENT = 'linear-gradient(90deg, #e0a63a, #f7cf5c)';

// 골드 면 위에서는 배지를 반투명 흰색으로 — 골드 위에 골드는 묻힌다
const BADGE_ON_GOLD = 'rgba(255, 255, 255, 0.55)';

interface PremiumBadgeProps {
  /** 로고 높이(px). 페이월은 37.5, 카드는 20 */
  logoHeight?: number;
  /** 골드 면 위에 놓이는가 */
  onGold?: boolean;
}

export const PremiumBadge = ({
  logoHeight = 37.5,
  onGold = false,
}: PremiumBadgeProps) => (
  <div className="flex items-center gap-2.5">
    {/* 흰 점은 스플래시 연출용 덮개라 여기선 숨겨 주황 점이 보이게 한다 */}
    <span className="flex" style={{ height: logoHeight }}>
      <LanditLogo className="h-full w-auto text-foreground [&_.logo-dot-splash]:hidden" />
    </span>
    <span
      className="rounded-full px-[11px] py-1 text-[13px] leading-[1.2] font-bold tracking-[0.12em] text-[#4a2f00]"
      style={{ background: onGold ? BADGE_ON_GOLD : GOLD_GRADIENT }}
    >
      PREMIUM
    </span>
  </div>
);
