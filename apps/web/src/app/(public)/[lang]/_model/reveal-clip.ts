// 폰 화면 바꾸기 모양 — 그 화면을 여는 자리(누르는 탭·버튼)에서 가장자리가 흐린 원이 퍼지거나, 카드를 넘기듯 좌우로 밀어 넘긴다

/** 원이 시작하는 자리 — 폰 화면 기준 가로·세로 % */
export type RevealOrigin = { x: number; y: number };

/** 흐린 가장자리 두께(px) — 또렷한 원 테두리 대신 다음 화면이 물들듯 번져 번쩍여 보이지 않는다 */
const FEATHER = 80;

/**
 * 다음 화면에 씌우는 마스크 — 검은 곳만 보인다
 * @param progress 화면 바꾸기 진행도(0~1)
 * @param size 폰 화면 크기(px) — 끝날 때 흐린 가장자리까지 가장 먼 구석을 지나도록 원 크기를 정한다
 */
export const revealMask = (
  progress: number,
  origin: RevealOrigin,
  { width, height }: { width: number; height: number },
) => {
  if (progress <= 0) return 'linear-gradient(transparent, transparent)';
  if (progress >= 1) return 'none';
  const dx = (width * Math.max(origin.x, 100 - origin.x)) / 100;
  const dy = (height * Math.max(origin.y, 100 - origin.y)) / 100;
  const radius = Math.round(progress * (Math.hypot(dx, dy) + FEATHER));
  return `radial-gradient(circle at ${origin.x}% ${origin.y}%, #000 ${Math.max(0, radius - FEATHER)}px, transparent ${radius}px)`;
};

/** 좌우로 밀어 넘기기 — 첫 화면은 왼쪽으로 나가고 다음 화면이 오른쪽에서 들어온다. 비슷한 두 장면도 다른 장면으로 넘어간 게 바로 보인다 */
export const slideShift = (progress: number) => ({
  first: `translateX(${progress === 0 ? 0 : -Math.round(progress * 1000) / 10}%)`,
  next: `translateX(${Math.round((1 - progress) * 1000) / 10}%)`,
});
