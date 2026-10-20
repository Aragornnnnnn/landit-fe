// @vitest-environment jsdom
// 프리뷰 다시 보기 — 개발자 묶음에서 켜면 이 계정의 프리뷰 단계를 처음으로 돌리고, 이번 실행 동안 프리뷰를 볼 수 있는 사람으로 친다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { isPreviewReplay, startPreviewReplay } from './preview-replay';
import { readPreviewStep } from './preview-store';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('premiumPreview-preview', () => {
  it('켜기 전에는 미리보기가 아니다', () => {
    expect(isPreviewReplay()).toBe(false);
  });

  it('켜면 프리뷰 단계를 처음(튜토리얼 차례)으로 돌리고 미리보기로 친다', () => {
    // Given 프리뷰를 이미 끝낸 계정
    localStorage.setItem('landit-premium-preview:7', 'COMPLETED');

    // When 다시 보기를 켜면
    startPreviewReplay(7);

    // Then 튜토리얼 차례로 돌아가고 미리보기가 켜진다
    expect(readPreviewStep(7)).toBe('STARTED');
    expect(isPreviewReplay()).toBe(true);
  });

  it('단계를 골라 켜면 그 단계를 끝낸 자리부터 이어 본다 — 카드 뒤집기부터 보려면 튜토리얼을 끝낸 자리', () => {
    startPreviewReplay(7, 'TUTORIAL_DONE');

    expect(readPreviewStep(7)).toBe('TUTORIAL_DONE');
  });

  it('세션 저장소를 못 써도 이번 실행에서는 미리보기로 친다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    startPreviewReplay(7);

    expect(isPreviewReplay()).toBe(true);
  });
});
