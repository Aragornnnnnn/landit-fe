// 위젯 카드 상자 계산 — 런처가 주는 칸에 아트 비율 그대로 들어가는 최대 크기를 구한다
// 셀은 정사각이 아니다(갤럭시 홈은 2×2도 세로가 길다). 칸을 꽉 채우면 아트가 잘리고 옆 위젯들보다 길쭉해 보인다

// 카드 모서리 라운드 — 디자인 카드(158dp 폭) 기준 dp, 그리는 쪽이 실측 크기로 환산한다
export const CARD_RADIUS = 24;

// 아트 원본 비율 — small 474×474, medium 1014×474, large 1014×1062
export const ART_RATIO = {
  small: 1,
  medium: 1014 / 474,
  large: 1014 / 1062,
} as const;

export const fitCard = ({
  width,
  height,
  ratio,
}: {
  width: number;
  height: number;
  ratio: number;
}) => {
  // 반올림하면 1px 위로 튀어 칸을 넘고, 넘긴 만큼 카드가 잘린다 — 항상 내림한다
  const cardWidth = Math.min(width, Math.floor(height * ratio));
  return {
    width: cardWidth,
    height: Math.min(height, Math.floor(cardWidth / ratio)),
  };
};
