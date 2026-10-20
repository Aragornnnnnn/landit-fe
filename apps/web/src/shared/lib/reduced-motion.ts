// 기기의 '동작 줄이기' 설정 — 켜져 있으면 숫자 세기·데모 반복 같은 연출을 건너뛰고 완성된 모습만 보여준다
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
