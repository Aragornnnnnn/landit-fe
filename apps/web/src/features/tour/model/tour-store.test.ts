// @vitest-environment jsdom
// 투어 단계 기기 저장 — 계정마다 따로, 모르는 값과 저장소 오류는 시작 전으로
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readTourStep, subscribeTourStep, writeTourStep } from './tour-store';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('tour-store', () => {
  it('저장한 단계를 같은 계정으로 다시 읽는다', () => {
    writeTourStep(7, 'CARD_FLIPPED');
    expect(readTourStep(7)).toBe('CARD_FLIPPED');
  });

  it('계정마다 따로 기억한다 — 다른 계정은 시작 전이다', () => {
    writeTourStep(7, 'COMPLETED');
    expect(readTourStep(8)).toBeNull();
  });

  it('알 수 없는 값이 들어 있으면 시작 전으로 본다', () => {
    localStorage.setItem('landit-first-expression-tour:7', 'WHAT');
    expect(readTourStep(7)).toBeNull();
  });

  it('저장소를 못 쓰면 시작 전으로 물러선다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readTourStep(7)).toBeNull();
  });

  it('저장하면 지켜보는 화면에 알린다', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeTourStep(onChange);
    writeTourStep(7, 'LEVEL_SEEN');
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
