// 서버가 준 래디 포즈 이름을 그림으로 — 모르는 포즈면 기본(POINT)으로 그린다
const DEFAULT_POSE_IMAGE = '/images/character/landy-point.webp';

const POSE_IMAGES: Record<string, string> = {
  POINT: DEFAULT_POSE_IMAGE,
  NORMAL: '/images/character/landy-normal.webp',
  WAVE_SMILE: '/images/character/landy-wave-smile.webp',
};

export const toPoseImage = (pose: string): string =>
  POSE_IMAGES[pose] ?? DEFAULT_POSE_IMAGE;
