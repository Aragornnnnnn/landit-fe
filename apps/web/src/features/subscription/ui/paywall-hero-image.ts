// 페이월 히어로 그림 — 페이월이 그리고, 대화 직후 흐름이 미리 받는다.
// 폭은 그리는 폭(최대 430px + 10px)에 맞춘다 — 1200으로 두면 2x 폰이 원본 크기 주소를 받아 20% 더 무겁다
import type { PreloadableImage } from '@/shared/lib/preload-next-images';

export const PAYWALL_HERO: PreloadableImage = {
  src: '/images/paywall-hero.webp',
  width: 440,
  height: 330,
};
