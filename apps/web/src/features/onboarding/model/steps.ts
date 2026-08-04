// 온보딩 스텝 순서 — 화면 진행과 헤더 진행점이 이 배열 하나를 따른다
export const STEP_ORDER = [
  'intro',
  'sound',
  'mic',
  'thought',
  'notification',
  'scenario',
] as const;

export type OnboardingStep = (typeof STEP_ORDER)[number];
