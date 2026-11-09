// 시나리오 벽 카드 배치 — 들어올 때마다 섞여 여러 번 오면 골고루 보이고, 가운데 오늘의 시나리오는 재밌는 주제에서만 뽑히는지 검증
import { describe, expect, it } from 'vitest';

import { buildWall, FUN_TODAY_IMAGES, wallFocus } from './scenario-wall';

/** 같은 씨앗이면 같은 수열을 내는 난수 — 섞기를 다시 돌려 볼 수 있게 한다 */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const ROWS = 4;
const PER_ROW = 24;

describe('buildWall', () => {
  it('벽과 오늘의 시나리오 사이에 같은 그림이 한 번도 겹치지 않는다', () => {
    const { today, rows } = buildWall(ROWS, PER_ROW, seeded(1));
    const images = [today, ...rows.flat()].map((card) => card.image);

    expect(new Set(images).size).toBe(images.length);
  });

  it('줄마다 칸이 다 차고 실제 시나리오 그림으로만 채운다', () => {
    const { rows } = buildWall(ROWS, PER_ROW, seeded(2));

    expect(rows).toHaveLength(ROWS);
    expect(rows.every((row) => row.length === PER_ROW)).toBe(true);
    expect(
      rows.flat().every((card) => card.image.includes('/scenarios/')),
    ).toBe(true);
  });

  it('오늘의 시나리오는 언제나 재밌는 주제 중에서 뽑는다', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const { today } = buildWall(ROWS, PER_ROW, seeded(seed));
      expect(FUN_TODAY_IMAGES).toContain(today.image);
    }
  });

  it('재밌는 주제는 모두 일본어 제목이 있어 일본어 화면에서도 가운데 카드에 제목이 보인다', () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const { today } = buildWall(ROWS, PER_ROW, seeded(seed));
      expect(today.title.ja).toBeTruthy();
    }
  });

  it('들어올 때마다 배치가 달라진다', () => {
    const first = buildWall(ROWS, PER_ROW, seeded(3)).rows[1].slice(8, 16);
    const second = buildWall(ROWS, PER_ROW, seeded(4)).rows[1].slice(8, 16);

    expect(first.map((card) => card.image)).not.toEqual(
      second.map((card) => card.image),
    );
  });

  it('여러 번 들어오면 모든 시나리오가 화면 가운데 칸에 한 번은 나온다', () => {
    const shown = new Set<string>();
    for (let seed = 0; seed < 300; seed += 1) {
      const { today, rows } = buildWall(ROWS, PER_ROW, seeded(seed));
      shown.add(today.image);
      for (const row of rows)
        for (const card of row.slice(9, 15)) shown.add(card.image);
    }
    const all = buildWall(ROWS, PER_ROW, seeded(0));
    const everyImage = new Set(
      [all.today, ...all.rows.flat()].map((card) => card.image),
    );

    for (const image of everyImage) expect(shown).toContain(image);
  });

  it('친구 그림(Chloe·Marco)이 한 줄에 셋 넘게 연달아 붙지 않는다', () => {
    const isFriend = (title: string) => /Chloe|Marco/.test(title);
    for (let seed = 0; seed < 50; seed += 1) {
      for (const row of buildWall(ROWS, PER_ROW, seeded(seed)).rows) {
        const flags = row.map((card) => isFriend(card.title.ko));
        const longest = flags.reduce(
          ({ run, max }, friend) => {
            const next = friend ? run + 1 : 0;
            return { run: next, max: Math.max(max, next) };
          },
          { run: 0, max: 0 },
        ).max;
        expect(longest).toBeLessThanOrEqual(3);
      }
    }
  });

  it('한국어 제목은 모두 한국어이고, 일본어 제목은 한국어가 섞이지 않은 일본어다', () => {
    const { today, rows } = buildWall(ROWS, PER_ROW, seeded(5));
    const cards = [today, ...rows.flat()];
    const japanese = cards.flatMap((card) => card.title.ja ?? []);

    expect(cards.every((card) => /[가-힣]/.test(card.title.ko))).toBe(true);
    expect(japanese.length).toBeGreaterThan(90);
    expect(japanese.every((title) => !/[가-힣]/.test(title))).toBe(true);
  });

  it('어색한 마르코 그림은 벽에 넣지 않는다', () => {
    const { today, rows } = buildWall(ROWS, PER_ROW, seeded(6));
    const images = [today, ...rows.flat()].map((card) => card.image);

    expect(images).not.toContain('/images/landing/scenarios/s-80.webp');
    expect(images).not.toContain('/images/landing/scenarios/s-84.webp');
  });
});

describe('wallFocus', () => {
  it('벽이 막 들어올 때는 오늘의 카드를 아직 띄우지 않는다', () => {
    // Given 벽이 화면 아래에서 막 보이기 시작한 진행도
    // When 집중도를 구하면
    // Then 0이다
    expect(wallFocus(0.1)).toBe(0);
  });

  it('벽이 화면 가운데쯤 오면 오늘의 카드가 다 떠오른다', () => {
    expect(wallFocus(0.5)).toBe(1);
    expect(wallFocus(0.9)).toBe(1);
  });

  it('그 사이에서는 스크롤한 만큼 떠오른다', () => {
    expect(wallFocus(0.325)).toBe(0.5);
  });
});
