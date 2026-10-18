// 축하 폭죽 — 브랜드 색으로 양쪽 아래에서 쏘고, 필요하면 가운데서 한 번 더 터뜨린다.
// ticks 150 ≈ 2.5초(60fps 기준), 세 발 합쳐 155개 — 화려하되 과하지 않게
import confetti from 'canvas-confetti';

const BASE = {
  spread: 70,
  startVelocity: 45,
  ticks: 150,
  colors: ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'],
  disableForReducedMotion: true,
};

/** 축하 폭죽을 터뜨린다. withCenter가 false면 양쪽 두 발만 쏜다 */
export const burstConfetti = ({ withCenter = true } = {}) => {
  confetti({ ...BASE, particleCount: 55, angle: 60, origin: { x: 0, y: 0.9 } });
  confetti({
    ...BASE,
    particleCount: 55,
    angle: 120,
    origin: { x: 1, y: 0.9 },
  });
  if (withCenter)
    confetti({
      ...BASE,
      particleCount: 45,
      spread: 110,
      origin: { x: 0.5, y: 0.6 },
    });
};
