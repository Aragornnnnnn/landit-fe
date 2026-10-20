// @vitest-environment jsdom
// 프리뷰 단계 기기 저장 — 계정마다 따로, 모르는 값과 저장소 오류는 시작 전으로
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readPreviewStep,
  subscribePreviewStep,
  writePreviewStep,
} from './preview-store';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('premiumPreview-store', () => {
  it('저장한 단계를 같은 계정으로 다시 읽는다', () => {
    writePreviewStep(7, 'CARD_FLIPPED');
    expect(readPreviewStep(7)).toBe('CARD_FLIPPED');
  });

  it('계정마다 따로 기억한다 — 다른 계정은 시작 전이다', () => {
    writePreviewStep(7, 'COMPLETED');
    expect(readPreviewStep(8)).toBeNull();
  });

  it('알 수 없는 값이 들어 있으면 시작 전으로 본다', () => {
    localStorage.setItem('landit-premium-preview:7', 'WHAT');
    expect(readPreviewStep(7)).toBeNull();
  });

  it('저장소를 못 쓰면 시작 전으로 물러선다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readPreviewStep(7)).toBeNull();
  });

  it('저장하면 지켜보는 화면에 알린다', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribePreviewStep(onChange);
    writePreviewStep(7, 'STARTED');
    expect(onChange).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('저장에 실패해도 이번 실행에서는 저장한 단계로 읽는다 — 튜토리얼이 닫히지 않고 홈을 막지 않게', () => {
    // Given 저장소가 가득 차 쓰기가 실패할 때
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    // When 다음 단계를 저장하면
    writePreviewStep(9, 'TUTORIAL_DONE');

    // Then 이번 실행에서는 그 단계로 읽힌다
    expect(readPreviewStep(9)).toBe('TUTORIAL_DONE');
  });
});
