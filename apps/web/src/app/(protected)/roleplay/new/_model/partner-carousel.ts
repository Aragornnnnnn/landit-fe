// 상대 캐러셀 규칙 — 끝이 없어 양끝에서 반대쪽으로 넘어가고, 각 상대는 보이는 상대 기준 왼쪽·가운데·오른쪽 자리에 선다
export const wrapCarouselIndex = (index: number, count: number) =>
  ((index % count) + count) % count;

/** 보이는 상대 기준 자리 — 0이 가운데, 음수가 왼쪽, 양수가 오른쪽 */
export const toCarouselSlot = (
  index: number,
  activeIndex: number,
  count: number,
) => {
  const half = Math.floor(count / 2);
  return wrapCarouselIndex(index - activeIndex + half, count) - half;
};
