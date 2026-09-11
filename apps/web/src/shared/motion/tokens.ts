// 전역 모션 토큰 — duration·easing·spring·전환 variants의 단일 출처 (DESIGN.md §9)
import type { Variants } from 'motion/react';

export const DURATION = {
  base: 0.25,
} as const;

// 코드 전반에서 이미 사실상 표준이던 ease. 부드럽게 감속하는 out 곡선.
export const EASE_STANDARD = [0.22, 1, 0.36, 1] as const;

// 선택 표시가 항목 사이를 옮겨 다닐 때 — 느긋하게 미끄러져 아주 살짝만 넘치는 스프링(감쇠비 약 0.85). 카드·탭 선택 프레임에 쓴다
export const SPRING_SELECT = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
} as const;

// 라우트 전환·전면 화면 교체 — 이동 없이 페이드만. transform을 쓰지 않으므로
// fixed 오버레이(바텀시트·오버레이)의 기준이 뷰포트로 유지된다.
export const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

// 플로우 내 방향성 슬라이드 — direction 1(전진)이면 오른쪽에서 들어와 왼쪽으로 나간다.
// reduced motion이면 이동(x)을 없애고 페이드만 남긴다.
const SLIDE_X = 24;
export const slideVariants = (reduced: boolean): Variants => ({
  enter: (direction: number) => ({
    opacity: 0,
    x: reduced ? 0 : direction * SLIDE_X,
  }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: reduced ? 0 : direction * -SLIDE_X,
  }),
});
