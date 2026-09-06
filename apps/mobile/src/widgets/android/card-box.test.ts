import { ART_RATIO, fitCard } from './card-box';

describe('fitCard', () => {
  it('칸이 세로로 길면 너비에 맞춰 카드를 잡는다 — 갤럭시 홈의 2×2가 이 경우다', () => {
    const card = fitCard({ width: 141, height: 171, ratio: 1 });

    expect(card).toEqual({ width: 141, height: 141 });
  });

  it('칸이 아트보다 가로로 길면 높이에 맞춰 카드를 잡는다', () => {
    const card = fitCard({ width: 300, height: 100, ratio: 1 });

    expect(card).toEqual({ width: 100, height: 100 });
  });

  it('가로형 아트는 비율을 지킨 채 칸 너비를 채운다', () => {
    const card = fitCard({ width: 320, height: 160, ratio: 2 });

    expect(card).toEqual({ width: 320, height: 160 });
  });

  it('반올림해도 칸을 넘지 않는다 — 1px만 넘쳐도 카드가 잘린다', () => {
    // 4×4 비율(1014:1062)에서 반올림이 위로 튀던 칸 크기
    const card = fitCard({ width: 180, height: 188, ratio: ART_RATIO.large });

    expect(card.width).toBeLessThanOrEqual(180);
    expect(card.height).toBeLessThanOrEqual(188);
  });

  it('어떤 칸에서도 칸을 넘지 않는다', () => {
    for (const ratio of Object.values(ART_RATIO)) {
      for (let width = 100; width <= 400; width += 7) {
        for (let height = 100; height <= 400; height += 11) {
          const card = fitCard({ width, height, ratio });

          expect(card.width).toBeLessThanOrEqual(width);
          expect(card.height).toBeLessThanOrEqual(height);
        }
      }
    }
  });
});
