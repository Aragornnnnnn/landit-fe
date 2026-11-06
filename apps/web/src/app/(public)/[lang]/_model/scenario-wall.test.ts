// 시나리오 벽 카드 배치 — 다양하게 섞이고 같은 그림이 붙지 않는지 검증
import { describe, expect, it } from 'vitest';

import {
  buildWallRows,
  pickToday,
  TODAY_SCENARIO,
  wallFocus,
} from './scenario-wall';

describe('buildWallRows', () => {
  it('벽 전체에서 같은 그림이 한 번도 겹치지 않는다', () => {
    const images = buildWallRows(4, 24)
      .flat()
      .map((card) => card.image);

    expect(new Set(images).size).toBe(images.length);
  });

  it('오늘의 시나리오 그림은 벽의 다른 칸에 나오지 않는다', () => {
    const images = buildWallRows(4, 24)
      .flat()
      .map((card) => card.image);

    expect(images).not.toContain(TODAY_SCENARIO.image);
  });

  it('한국어 제목은 96장 모두 있고 영어 문장이 아니다', () => {
    const titles = buildWallRows(4, 24)
      .flat()
      .map((card) => card.title.ko);

    expect(titles).toHaveLength(96);
    expect(titles.every((title) => /[가-힣]/.test(title))).toBe(true);
  });

  it('일본어 제목은 한국어가 섞이지 않은 일본어다 — 한국에만 맞는 상황은 제목 없이 그림만 둔다', () => {
    const cards = buildWallRows(4, 24).flat();
    const japanese = cards.flatMap((card) => card.title.ja ?? []);

    expect(japanese.length).toBeGreaterThan(90);
    expect(japanese.every((title) => !/[가-힣]/.test(title))).toBe(true);
    expect(
      japanese.every((title) => /[\u3040-\u30ff\u4e00-\u9fff]/.test(title)),
    ).toBe(true);
  });

  it('줄마다 칸이 다 차고 실제 시나리오 그림으로만 채운다', () => {
    const rows = buildWallRows(4, 24);
    const images = rows.flat().map((card) => card.image);

    expect(rows.every((row) => row.length === 24)).toBe(true);
    expect(images.every((image) => image.includes('/scenarios/'))).toBe(true);
  });

  it('어색한 마르코 그림은 벽에 넣지 않는다', () => {
    const images = buildWallRows(4, 24)
      .flat()
      .map((card) => card.image);

    expect(images).not.toContain('/images/landing/scenarios/s-80.webp');
    expect(images).not.toContain('/images/landing/scenarios/s-84.webp');
  });
});

describe('pickToday', () => {
  it('뽑는 값에 따라 다른 카드를 오늘의 시나리오로 고른다', () => {
    const rows = buildWallRows(4, 24);

    expect(pickToday(rows, 0).today).toBe(rows[0][0]);
    expect(pickToday(rows, 0.999).today).toBe(rows[3][23]);
  });

  it('맞바꾼 뒤에도 벽과 오늘의 시나리오 사이에 겹치는 그림이 없다', () => {
    const { today, rows } = pickToday(buildWallRows(4, 24), 0.5);
    const images = [today, ...rows.flat()].map((card) => card.image);

    expect(new Set(images).size).toBe(images.length);
    expect(rows.flat()).toContain(TODAY_SCENARIO);
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
