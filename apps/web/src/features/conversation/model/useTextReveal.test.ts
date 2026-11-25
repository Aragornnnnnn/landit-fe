// 말풍선마다 영어 글자를 가릴지 — 사용자가 그 말풍선에서 고른 대로, 고른 적 없으면 설정대로인지 검증한다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useTextReveal } from './useTextReveal';

describe('useTextReveal', () => {
  it('직접 바꾼 적 없는 말풍선은 설정을 따른다', () => {
    // Given 글자를 가리는 설정
    const { result } = renderHook(() => useTextReveal(true));

    // Then
    expect(result.current.hiddenFor(3)).toBe(true);
  });

  it('말풍선에서 글자를 펼쳐 봤으면, 지난 대화가 돼도 펼친 채로 둔다', () => {
    // Given 글자를 가리는 설정에서
    const { result } = renderHook(() => useTextReveal(true));

    // When 3번째 말풍선에서 글자를 펼치면
    act(() => result.current.record(3, true));

    // Then 그 말풍선만 보이고 나머지는 설정대로 가린다
    expect(result.current.hiddenFor(3)).toBe(false);
    expect(result.current.hiddenFor(4)).toBe(true);
  });

  it('글자를 보이는 설정이어도 직접 가린 말풍선은 가린 채로 둔다', () => {
    // Given
    const { result } = renderHook(() => useTextReveal(false));

    // When
    act(() => result.current.record(2, false));

    // Then
    expect(result.current.hiddenFor(2)).toBe(true);
  });
});
