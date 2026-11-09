// 버튼이 닿은 자리가 끌기 요소·스크롤 영역·그 밖 중 어디인지 정한다 — 탭 진동을 바로 울릴지 탭이 확정될 때까지 미룰지의 기준

const SCROLLING_OVERFLOW = /auto|scroll/;
// 페이지 자체(루트)는 overflow가 visible이어도 스크롤되고, 막아 둔 경우만 스크롤되지 않는다
const BLOCKED_OVERFLOW = /hidden|clip/;

// 이 요소가 실제로 스크롤되는가 — overflow만 열려 있고 내용이 안 넘치면 스크롤되지 않는다
const canScroll = (el: Element, style: CSSStyleDeclaration) => {
  const { overflowX, overflowY } = style;
  const isPage = el === (document.scrollingElement ?? document.documentElement);
  const opens = (overflow: string) =>
    isPage
      ? !BLOCKED_OVERFLOW.test(overflow)
      : SCROLLING_OVERFLOW.test(overflow);
  const scrollsY = opens(overflowY) && el.scrollHeight > el.clientHeight;
  const scrollsX = opens(overflowX) && el.scrollWidth > el.clientWidth;
  return scrollsY || scrollsX;
};

// 닿은 자리의 성격 — 손가락이 스크롤이나 끌기로 이어질 수 있으면 탭이 확정될 때까지 진동을 미룬다
export type PressArea = 'still' | 'scroll' | 'drag';

// 닿은 자리를 가까운 조상부터 거슬러 올라가며 끌기 요소·스크롤 영역·그 밖 중 어디인지 정한다
export const classifyPressArea = (el: Element): PressArea => {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    // 스크롤을 막아 둔 끌기 요소(퀴즈 칩)는 브라우저가 취소 신호를 주지 않아 움직인 거리로 직접 거른다
    if (style.touchAction === 'none') return 'drag';
    if (canScroll(node, style)) return 'scroll';
    // 화면 고정 요소(하단 CTA 등)는 거의 늘 누르려고 닿으므로 바깥 스크롤과 상관없는 곳으로 본다
    if (style.position === 'fixed') return 'still';
  }
  return 'still';
};
