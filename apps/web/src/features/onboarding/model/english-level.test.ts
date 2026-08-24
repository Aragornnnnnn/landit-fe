// 영어 수준 저장 — 기기(다시 묻지 않기)와 서버(맞춤 학습)에 함께 남기는 계약 검증
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateLearningLevel } from '../api/learning-level';
import {
  ENGLISH_LEVELS,
  getEnglishLevel,
  hasAnsweredEnglishLevel,
  markEnglishLevelAnswered,
} from './english-level';

vi.mock('../api/learning-level', () => ({
  updateLearningLevel: vi.fn(() => Promise.resolve(null)),
}));
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));

const updateLearningLevelMock = vi.mocked(updateLearningLevel);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('hasAnsweredEnglishLevel', () => {
  it('저장된 적 없으면 false다', () => {
    expect(hasAnsweredEnglishLevel()).toBe(false);
  });

  it('markEnglishLevelAnswered로 저장한 뒤엔 true다', () => {
    markEnglishLevelAnswered('BEGINNER');

    expect(hasAnsweredEnglishLevel()).toBe(true);
  });
});

describe('getEnglishLevel', () => {
  it('저장된 적 없으면 null이다', () => {
    expect(getEnglishLevel()).toBeNull();
  });

  it('저장한 값을 그대로 돌려준다 — 마이페이지에서 지금 값을 보여줄 때 쓴다', () => {
    markEnglishLevelAnswered('ADVANCED');

    expect(getEnglishLevel()).toBe('ADVANCED');
  });
});

describe('markEnglishLevelAnswered — 서버 저장', () => {
  it('고른 수준의 rank(1~5 정수)를 서버에도 보낸다', () => {
    markEnglishLevelAnswered('INTERMEDIATE');

    expect(updateLearningLevelMock).toHaveBeenCalledWith(3);
  });

  it('서버 저장이 실패해도 기기 기록은 남는다 — 흐름을 막지 않는다', async () => {
    updateLearningLevelMock.mockRejectedValueOnce(new Error('network'));

    markEnglishLevelAnswered('FLUENT');
    // 거부된 Promise가 조용히 소비되는지(unhandled rejection 없음)까지 확인한다
    await vi.waitFor(() => expect(updateLearningLevelMock).toHaveBeenCalled());

    expect(hasAnsweredEnglishLevel()).toBe(true);
  });
});

describe('ENGLISH_LEVELS', () => {
  it('선택지가 5개이고 id가 서로 겹치지 않는다', () => {
    expect(ENGLISH_LEVELS).toHaveLength(5);
    expect(new Set(ENGLISH_LEVELS.map((level) => level.id)).size).toBe(5);
  });

  it('rank가 1부터 5까지 순서대로 매겨져 BE 저장 API(정수 1~5)에 그대로 실을 수 있다', () => {
    expect(ENGLISH_LEVELS.map((level) => level.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it('emoji가 서로 겹치지 않는다', () => {
    expect(new Set(ENGLISH_LEVELS.map((level) => level.emoji)).size).toBe(5);
  });
});
