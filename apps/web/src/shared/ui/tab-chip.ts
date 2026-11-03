// 탭 칩의 규격 — 고를 것들을 한 줄에 늘어놓는 알약 모양 칩. 탭 셸과 편지함이 같은 자를 쓴다
//
// 컴포넌트가 아니라 클래스만 나눈다. 한쪽은 주소를 옮기는 Link(aria-current)고 한쪽은 상태를
// 바꾸는 button(aria-pressed)이라, 하나로 묶으면 둘 중 하나는 거짓말하는 접근성 표시를 달게 된다

// 칩들이 앉는 줄. 아래 여백은 칩과 본문 사이 간격이라 줄이 정한다
export const TAB_CHIP_ROW =
  'flex shrink-0 gap-2 bg-background px-5 pt-1 pb-2.5';

export const tabChipClass = (isActive: boolean) =>
  `shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-foreground text-background'
      : 'bg-secondary text-secondary-foreground'
  }`;
