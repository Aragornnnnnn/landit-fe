// 축하 폭죽 — 양쪽 아래에서 쏘고, 필요하면 가운데서 한 번 더 터뜨린다. 기본은 브랜드 색 세 발.
// ticks 150 ≈ 2.5초(60fps 기준), 세 발 합쳐 155개 — 화려하되 과하지 않게
import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'];

interface BurstOptions extends Pick<
  confetti.Options,
  'colors' | 'spread' | 'startVelocity' | 'ticks' | 'particleCount'
> {
  // 가운데 한 발을 더 쏠지
  withCenter?: boolean;
  // 양쪽 발사 높이 — 0이 화면 위, 1이 화면 아래
  originY?: number;
}

/** 축하 폭죽을 터뜨린다. 옵션을 안 주면 브랜드 색으로 양쪽 두 발과 가운데 한 발 */
export const burstConfetti = ({
  withCenter = true,
  originY = 0.9,
  colors = BRAND_COLORS,
  spread = 70,
  startVelocity = 45,
  ticks = 150,
  particleCount = 55,
}: BurstOptions = {}) => {
  const base = {
    colors,
    spread,
    startVelocity,
    ticks,
    particleCount,
    disableForReducedMotion: true,
  };
  confetti({ ...base, angle: 60, origin: { x: 0, y: originY } });
  confetti({ ...base, angle: 120, origin: { x: 1, y: originY } });
  if (withCenter)
    confetti({
      ...base,
      particleCount: 45,
      spread: 110,
      origin: { x: 0.5, y: 0.6 },
    });
};
