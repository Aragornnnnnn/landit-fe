// 고치기 첫 안내 훅 검증 — 처음 한 번만 보이고, 한 번 사라지면 다시 안 뜨는지
// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { editHintSeen } from './edit-hint-seen';
import { useEditHint } from './useEditHint';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('useEditHint', () => {
  it('처음 확인 화면이면 안내를 띄운다', () => {
    const { result } = renderHook(() => useEditHint(true));

    expect(result.current).toBe(true);
  });

  it('확인 화면이 아니면 띄우지 않는다', () => {
    const { result } = renderHook(() => useEditHint(false));

    expect(result.current).toBe(false);
  });

  it('한 번 보였다가 사라지면(보내기·다시 말하기·수정) 다음 확인 화면에선 띄우지 않는다', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useEditHint(active),
      { initialProps: { active: true } },
    );

    rerender({ active: false });
    act(() => rerender({ active: true }));

    expect(result.current).toBe(false);
    expect(editHintSeen.has()).toBe(true);
  });

  it('이미 본 기기면 처음부터 띄우지 않는다', () => {
    editHintSeen.mark();

    const { result } = renderHook(() => useEditHint(true));

    expect(result.current).toBe(false);
  });
});
