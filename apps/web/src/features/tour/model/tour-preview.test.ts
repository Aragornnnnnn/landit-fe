// @vitest-environment jsdom
// 투어 다시 보기 — 개발자 묶음에서 켜면 이 계정의 투어 단계를 처음으로 돌리고, 이번 실행 동안 투어를 볼 수 있는 사람으로 친다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isTourPreview, startTourPreview } from './tour-preview';
import { readTourStep } from './tour-store';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('tour-preview', () => {
  it('켜기 전에는 미리보기가 아니다', () => {
    expect(isTourPreview()).toBe(false);
  });

  it('켜면 투어 단계를 처음(튜토리얼 차례)으로 돌리고 미리보기로 친다', () => {
    // Given 투어를 이미 끝낸 계정
    localStorage.setItem('landit-first-expression-tour:7', 'COMPLETED');

    // When 다시 보기를 켜면
    startTourPreview(7);

    // Then 튜토리얼 차례로 돌아가고 미리보기가 켜진다
    expect(readTourStep(7)).toBe('STARTED');
    expect(isTourPreview()).toBe(true);
  });

  it('세션 저장소를 못 써도 이번 실행에서는 미리보기로 친다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    startTourPreview(7);

    expect(isTourPreview()).toBe(true);
  });
});
