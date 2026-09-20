// 서버가 준 래디 포즈 이름을 그림으로 — 모르는 포즈면 기본(POINT)으로 그린다.
// 오늘의 스몰톡이 그리고, 대화 화면이 끝나는 자리에서 미리 받아 둔다
const DEFAULT_POSE_IMAGE = '/images/character/landy-point.webp';

const POSE_IMAGES: Record<string, string> = {
  POINT: DEFAULT_POSE_IMAGE,
  NORMAL: '/images/character/landy-normal.webp',
  WAVE_SMILE: '/images/character/landy-wave-smile.webp',
};

export const toPoseImage = (pose: string): string =>
  POSE_IMAGES[pose] ?? DEFAULT_POSE_IMAGE;

// 다음 스몰톡에서 블록의 래디 — 잡이 끝난 뒤 스켈레톤을 밀어내며 서는 자리라 그때 처음 받으면 늦다
export const FOLLOW_UP_IMAGE = '/images/character/landy-peek.webp';

// 어느 포즈가 올지 응답 전엔 모른다 — 셋 다, 그리고 후속 질문 래디까지 미리 받아야 화면이 뜰 때 그림이 비지 않는다
export const SUMMARY_IMAGE_SOURCES = [
  ...Object.values(POSE_IMAGES),
  FOLLOW_UP_IMAGE,
];
