// 온보딩 스텝 순서 — 화면 진행과 헤더 진행점이 이 배열 하나를 따른다.
// 영어 수준은 묻지 않는다 — 첫 대화가 곧 수준 파악이라 BE가 매긴다 (landit-be #169).
// 마지막 scenario는 시나리오 화면으로 넘기는 스텝이다 (무엇을 그리는지가 아니라 어디로 보내는지)
export const STEP_ORDER = [
  'intro',
  'sound',
  'mic',
  'thought',
  'notification',
  'widget',
  'accent',
  'scenario',
] as const;

export type OnboardingStep = (typeof STEP_ORDER)[number];
