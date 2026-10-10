// CTA가 결제 대신 맨 아래로 내려 줘야 하는지 — 플랜 칸이 화면(하단 CTA에 가린 곳 제외)에 통째로 보이지 않을 때만 그렇다.
// 더 내려갈 곳이 없으면 언제나 결제로 보낸다 — 판정이 어긋나도 버튼이 먹통이 되지 않게
interface Box {
  top: number;
  bottom: number;
}

/** 화면 배율로 생기는 소수점 오차 — 이만큼 넘친 건 보인 것으로 친다 */
const TOLERANCE = 2;

/**
 * covered — 화면 아래에서 하단 고정 CTA가 가리는 높이. atBottom — 이미 맨 아래까지 내려왔는가.
 * 크기를 잴 수 없으면(배치 전·테스트 환경) 결제를 막지 않도록 false
 */
export const needsScrollToPlans = (
  plans: Box & { height: number },
  viewport: Box,
  covered: number,
  atBottom: boolean,
) => {
  if (plans.height <= 0 || atBottom) return false;
  const visibleBottom = viewport.bottom - covered;
  const bottomHidden = plans.bottom > visibleBottom + TOLERANCE;
  // 칸이 보이는 영역보다 크면 위아래를 한꺼번에 볼 수 없다 — 아래 끝(카드·약관)만 보이면 된다
  if (plans.height > visibleBottom - viewport.top) return bottomHidden;
  return plans.top < viewport.top - TOLERANCE || bottomHidden;
};
