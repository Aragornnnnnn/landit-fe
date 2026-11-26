// 캐릭터 층 상자를 제 그림 영역만큼만 잡는 계산 — 상자마다 합성 레이어가 되므로 상자 크기가 곧 GPU 메모리다
//
// 층을 그릴 영역 전체(viewBox) 크기로 겹쳐 놓으면 입 하나짜리 층도 캐릭터 상자만 한 레이어를 잡는다.
// 영역은 전부 원본 그림 좌표(SVG 단위)이고, 상자는 부모 영역 기준 %로 놓아 원래 한 장에서와 같은 자리에 맞물린다.

/** 원본 그림 좌표의 사각 영역 — viewBox와 같은 네 값이다 */
export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const readArea = (viewBox: string): Area => {
  const [x, y, width, height] = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return { x, y, width, height };
};

export const toViewBox = ({ x, y, width, height }: Area) =>
  `${x} ${y} ${width} ${height}`;

/** 그릴 영역 밖은 어차피 잘려 안 보인다 — 안쪽만 남겨 레이어가 보이지 않는 부분까지 잡지 않게 한다 */
export const clipArea = (area: Area, frame: Area): Area | null => {
  const left = Math.max(area.x, frame.x);
  const top = Math.max(area.y, frame.y);
  const right = Math.min(area.x + area.width, frame.x + frame.width);
  const bottom = Math.min(area.y + area.height, frame.y + frame.height);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
};

export const unionAreas = (areas: readonly Area[]): Area => {
  const left = Math.min(...areas.map((area) => area.x));
  const top = Math.min(...areas.map((area) => area.y));
  const right = Math.max(...areas.map((area) => area.x + area.width));
  const bottom = Math.max(...areas.map((area) => area.y + area.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const percent = (value: number) => `${Number((value * 100).toFixed(3))}%`;

/** 부모 상자 안에서 영역이 차지하는 자리(CSS) */
export const placeArea = (area: Area, parent: Area) => ({
  left: percent((area.x - parent.x) / parent.width),
  top: percent((area.y - parent.y) / parent.height),
  width: percent(area.width / parent.width),
  height: percent(area.height / parent.height),
});
