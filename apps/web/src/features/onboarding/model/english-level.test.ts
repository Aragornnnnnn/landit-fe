// 영어 수준 로컬 저장 — BE 연동 전까지 기기에 남겨 다시 묻지 않는 계약 검증
import { beforeEach, describe, expect, it } from 'vitest';

import {
  ENGLISH_LEVELS,
  hasAnsweredEnglishLevel,
  markEnglishLevelAnswered,
} from './english-level';

beforeEach(() => localStorage.clear());

describe('hasAnsweredEnglishLevel', () => {
  it('저장된 적 없으면 false다', () => {
    expect(hasAnsweredEnglishLevel()).toBe(false);
  });

  it('markEnglishLevelAnswered로 저장한 뒤엔 true다', () => {
    markEnglishLevelAnswered('BEGINNER');

    expect(hasAnsweredEnglishLevel()).toBe(true);
  });
});

describe('ENGLISH_LEVELS', () => {
  it('선택지가 5개이고 id가 서로 겹치지 않는다', () => {
    expect(ENGLISH_LEVELS).toHaveLength(5);
    expect(new Set(ENGLISH_LEVELS.map((level) => level.id)).size).toBe(5);
  });
});
