// 영어 수준 선택지 계약 검증 — 서버가 준 정수를 화면 선택지로 옮기는 지점
import { describe, expect, it } from 'vitest';

import { ENGLISH_LEVELS, toEnglishLevel } from './english-level';

describe('ENGLISH_LEVELS', () => {
  it('선택지가 5개이고 level이 1부터 5까지 순서대로다 — BE 계약(정수 1~5)과 같다', () => {
    expect(ENGLISH_LEVELS.map((item) => item.level)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('toEnglishLevel', () => {
  it('선택지 안의 값은 그대로 돌려준다', () => {
    expect(toEnglishLevel(4)).toBe(4);
  });

  it('아직 안 답해 null이면 null이다', () => {
    expect(toEnglishLevel(null)).toBeNull();
  });

  it('1~5 밖의 값은 안 고른 것으로 본다 — 없는 카드를 강조할 수는 없다', () => {
    expect(toEnglishLevel(0)).toBeNull();
    expect(toEnglishLevel(9)).toBeNull();
  });
});
