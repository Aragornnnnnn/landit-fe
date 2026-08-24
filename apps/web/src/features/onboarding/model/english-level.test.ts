// 영어 수준 저장 — 기기(다시 묻지 않기)와 서버(맞춤 학습)에 같은 1~5 정수로 남기는 계약 검증
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
    markEnglishLevelAnswered(1);

    expect(hasAnsweredEnglishLevel()).toBe(true);
  });

  it('1~5 밖의 값이 들어 있으면 안 답한 것으로 본다 — 옛 형식(문자열) 기기 포함', () => {
    localStorage.setItem('landit-english-level', 'INTERMEDIATE');

    expect(hasAnsweredEnglishLevel()).toBe(false);
  });
});

describe('getEnglishLevel', () => {
  it('저장된 적 없으면 null이다', () => {
    expect(getEnglishLevel()).toBeNull();
  });

  it('저장한 값을 그대로 돌려준다 — 마이페이지에서 지금 값을 보여줄 때 쓴다', () => {
    markEnglishLevelAnswered(4);

    expect(getEnglishLevel()).toBe(4);
  });
});

describe('markEnglishLevelAnswered — 저장 형식', () => {
  it('기기와 서버 모두 같은 1~5 정수로 남긴다', () => {
    markEnglishLevelAnswered(3);

    expect(localStorage.getItem('landit-english-level')).toBe('3');
    expect(updateLearningLevelMock).toHaveBeenCalledWith(3);
  });

  it('서버 저장이 실패해도 기기 기록은 남는다 — 흐름을 막지 않는다', async () => {
    updateLearningLevelMock.mockRejectedValueOnce(new Error('network'));

    markEnglishLevelAnswered(5);
    // 거부된 Promise가 조용히 소비되는지(unhandled rejection 없음)까지 확인한다
    await vi.waitFor(() => expect(updateLearningLevelMock).toHaveBeenCalled());

    expect(hasAnsweredEnglishLevel()).toBe(true);
  });
});

describe('ENGLISH_LEVELS', () => {
  it('선택지가 5개이고 level이 1부터 5까지 순서대로다 — BE 계약(정수 1~5)과 같다', () => {
    expect(ENGLISH_LEVELS.map((item) => item.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it('emoji가 서로 겹치지 않는다', () => {
    expect(new Set(ENGLISH_LEVELS.map((item) => item.emoji)).size).toBe(5);
  });
});
