// 폰 화면 바꾸기 진행도 — 폰이 보이는 판의 가운데가 화면 55% 높이에 올 때까지는 첫 화면을 다 보여 주고, 45%까지 올라오는 짧은 사이에 다음 화면으로 다 바뀐다. 폰 전체가 화면에 보이는 동안 끝나 머리글에 가리지 않는다. 스크롤을 되돌리면 진행도도 되돌아간다

const START = 0.55;
const END = 0.45;

/**
 * @param centerY 폰이 보이는 판 가운데의 화면 기준 y(px)
 * @param viewportHeight 화면 높이(px)
 */
export const swapProgress = (centerY: number, viewportHeight: number) => {
  const progress =
    (START * viewportHeight - centerY) / ((START - END) * viewportHeight);
  // 소수 계산 오차(0.9999…)로 끝에서 1px 틈이 남지 않게 셋째 자리에서 반올림한다
  return Math.min(1, Math.max(0, Math.round(progress * 1000) / 1000));
};
