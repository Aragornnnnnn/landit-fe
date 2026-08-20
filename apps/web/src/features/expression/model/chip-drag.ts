// 올린 단어 칩을 끌어 순서를 바꿀 때 쓰는 계산 — 놓을 자리, 순서 이동, 자리가 옮겨간 만큼의 기준점 보정

export interface Point {
  x: number;
  y: number;
}

// 칩이 차지한 자리 — 답변 줄 기준이라 밀려나는 연출 중에도 흔들리지 않는다(화면 좌표는 transform을 타서 안 쓴다)
export interface ChipBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// from 자리의 칩을 to 자리로 옮긴 새 순서 — 사이 칩들은 한 칸씩 밀리거나 당겨진다
export const moveChip = (
  selected: number[],
  from: number,
  to: number,
): number[] => {
  const next = [...selected];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

// 칩이 포인터보다 앞에 있는가 — 줄(세로)이 먼저, 같은 줄이면 칩 중심(가로)으로 앞뒤를 가른다
const isBeforePoint = (box: ChipBox, point: Point) =>
  box.bottom < point.y ||
  (box.top <= point.y && (box.left + box.right) / 2 < point.x);

// 끌고 있는 칩이 들어갈 자리 — 포인터가 이미 지나친 다른 칩의 수.
// 끌고 있는 칩 자신은 세지 않아, 순서가 바뀌어도 손이 같은 곳이면 같은 자리가 나온다(끄는 동안 앞뒤로 튀지 않게)
export const dropIndexAt = (
  boxes: ChipBox[],
  dragging: number,
  point: Point,
): number =>
  boxes.filter((box, index) => index !== dragging && isBeforePoint(box, point))
    .length;

// 칩 자리가 옮겨간 만큼 기준점을 같이 민다 — 순서가 바뀌어도 칩이 손가락에 그대로 붙어 있게
export const shiftOrigin = (
  origin: Point,
  before: ChipBox,
  after: ChipBox,
): Point => ({
  x: origin.x + (after.left - before.left),
  y: origin.y + (after.top - before.top),
});
