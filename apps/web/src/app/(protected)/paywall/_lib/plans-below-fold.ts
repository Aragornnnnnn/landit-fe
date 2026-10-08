// CTA가 결제 대신 맨 아래로 내려 줘야 하는지 — 플랜 칸이 화면(하단 CTA에 가린 곳 제외)에 통째로 보이지 않을 때만 그렇다
interface Box {
  top: number;
  bottom: number;
}

/** covered — 화면 아래에서 하단 고정 CTA가 가리는 높이. 크기를 잴 수 없으면(배치 전·테스트 환경) 결제를 막지 않도록 false */
export const needsScrollToPlans = (
  plans: Box & { height: number },
  viewport: Box,
  covered: number,
) =>
  plans.height > 0 &&
  (plans.top < viewport.top || plans.bottom > viewport.bottom - covered);
