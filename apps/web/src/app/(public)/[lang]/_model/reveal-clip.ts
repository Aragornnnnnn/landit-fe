// 다음 폰 화면이 퍼지는 원 — 그 화면을 여는 자리(누르는 탭·버튼, 떠오르는 속마음)에서 원이 커지며 다음 화면을 드러낸다

/** 원이 폰 화면을 다 덮는 크기 — 세로로 긴 화면(1:2.16)의 한쪽 끝에서 시작해도 반대쪽 구석까지 닿는다(약 117%)에 여유를 둔 값 */
const FULL = 130;

/** 원이 시작하는 자리 — 폰 화면 기준 가로·세로 % */
export type RevealOrigin = { x: number; y: number };

/** @param progress 화면 바꾸기 진행도(0~1) */
export const revealClip = (progress: number, origin: RevealOrigin) =>
  `circle(${Math.round(progress * FULL * 10) / 10}% at ${origin.x}% ${origin.y}%)`;

/** 가장자리 띠 두께(px) — 안쪽으로 부드럽게 밝아지다가 원 끝에서 끊긴다 */
const BAND = 24;

/**
 * 퍼지는 원 가장자리를 따라가는 밝은 띠 — 두 화면의 배경이 같아도 화면 전체가 바뀌는 게 보이게 한다. 바뀌기 전·후엔 없다
 * @param size 폰 화면 크기(px) — 원 크기 %는 화면 대각선/√2 기준이라 같은 크기의 px로 바꿔 그린다
 */
export const revealRing = (
  progress: number,
  origin: RevealOrigin,
  { width, height }: { width: number; height: number },
) => {
  if (progress <= 0 || progress >= 1) return 'none';
  const radius = Math.round(
    ((progress * FULL) / 100) * Math.sqrt((width ** 2 + height ** 2) / 2),
  );
  return `radial-gradient(circle at ${origin.x}% ${origin.y}%, transparent ${radius - BAND}px, rgba(255, 255, 255, 0.55) ${radius - 2}px, transparent ${radius}px)`;
};
