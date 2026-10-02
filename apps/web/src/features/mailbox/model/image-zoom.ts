// 확대 보기 규칙 — 몇 배까지 키우고, 버튼·더블탭이 어디로 가고, 커진 사진을 어디까지 옮기고, 손가락이 무슨 뜻인지
export const MIN_SCALE = 1;
export const MAX_SCALE = 3;

// 넘기기·쓸어 닫기로 읽는 최소 거리 — 살짝 흔들린 손가락을 명령으로 받지 않는다
const SWIPE_PX = 60;
const DISMISS_PX = 120;

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** 핀치로 범위를 넘어도 1~3배 안에 둔다 */
export const clampScale = (scale: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

/** +/− 버튼 — 정수 배율로 한 칸. 핀치로 멈춘 중간 배율이면 가까운 쪽 정수부터 간다 */
export const stepScale = (scale: number, direction: 1 | -1) =>
  clampScale(
    direction === 1
      ? Math.floor(scale + 1e-6) + 1
      : Math.ceil(scale - 1e-6) - 1,
  );

/** 더블탭 — 원래 크기면 2배, 커져 있으면 원래 크기로 */
export const toggleScale = (scale: number) =>
  scale > MIN_SCALE ? MIN_SCALE : 2;

/**
 * 커진 사진을 옮길 수 있는 범위로 자른다. 커진 크기가 화면보다 작은 축은 가운데에 둔다.
 *
 * @param fitted 1배일 때 화면에 맞춘 사진 크기
 * @param frame 화면 크기
 */
export const clampPan = (
  pan: Point,
  scale: number,
  fitted: Size,
  frame: Size,
): Point => {
  const limitX = Math.max(0, (fitted.width * scale - frame.width) / 2);
  const limitY = Math.max(0, (fitted.height * scale - frame.height) / 2);
  const clamp = (value: number, limit: number) =>
    Math.min(limit, Math.max(-limit, value)) || 0;
  return { x: clamp(pan.x, limitX), y: clamp(pan.y, limitY) };
};

/**
 * 원래 크기에서 손가락이 움직인 방향을 명령으로 읽는다.
 * 확대한 상태의 드래그는 사진 이동이라 명령이 아니다
 */
export const readSwipe = (
  { dx, dy }: { dx: number; dy: number },
  scale: number,
): 'next' | 'prev' | 'close' | null => {
  if (scale > MIN_SCALE) return null;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx <= -SWIPE_PX) return 'next';
    if (dx >= SWIPE_PX) return 'prev';
    return null;
  }
  return dy >= DISMISS_PX ? 'close' : null;
};
