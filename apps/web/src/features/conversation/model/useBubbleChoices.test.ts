// 상대 말풍선마다 사용자가 고른 것 — 글자 보임은 고른 대로(고른 적 없으면 설정대로), 해석 펼침은 접을 때까지 기억하는지 검증한다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBubbleChoices } from './useBubbleChoices';

describe('useBubbleChoices', () => {
  it('직접 바꾼 적 없는 말풍선은 설정을 따른다', () => {
    // Given 글자를 가리는 설정
    const { result } = renderHook(() => useBubbleChoices(true));

    // Then
    expect(result.current.hiddenFor(3)).toBe(true);
  });

  it('말풍선에서 글자를 펼쳐 봤으면, 지난 대화가 돼도 펼친 채로 둔다', () => {
    // Given 글자를 가리는 설정에서
    const { result } = renderHook(() => useBubbleChoices(true));

    // When 3번째 말풍선에서 글자를 펼치면
    act(() => result.current.recordText(3, true));

    // Then 그 말풍선만 보이고 나머지는 설정대로 가린다
    expect(result.current.hiddenFor(3)).toBe(false);
    expect(result.current.hiddenFor(4)).toBe(true);
  });

  it('글자를 보이는 설정이어도 직접 가린 말풍선은 가린 채로 둔다', () => {
    // Given
    const { result } = renderHook(() => useBubbleChoices(false));

    // When
    act(() => result.current.recordText(2, false));

    // Then
    expect(result.current.hiddenFor(2)).toBe(true);
  });

  it('해석을 펼친 턴은 접을 때까지 기억한다 — 지난 대화가 되면 펼친 채 나타나 접히게', () => {
    // Given
    const { result } = renderHook(() => useBubbleChoices(false));

    // When 2번째 말풍선에서 해석을 펼치면
    act(() => result.current.recordTranslation(2, true));

    // Then 그 턴만 펼친 것으로 남는다
    expect(result.current.translationWasOpen(2)).toBe(true);
    expect(result.current.translationWasOpen(3)).toBe(false);

    // When 접으면 지운다
    act(() => result.current.recordTranslation(2, false));

    // Then
    expect(result.current.translationWasOpen(2)).toBe(false);
  });
});
