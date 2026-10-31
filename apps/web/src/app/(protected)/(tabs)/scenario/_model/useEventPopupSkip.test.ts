// useEventPopupSkip — 한 번 건너뛰기로 정한 방문은 그 흐름이 끝나도 끝까지 건너뛰는 계약 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useEventPopupSkip } from './useEventPopupSkip';

const quiet = {
  onboarded: false,
  previewTurn: false,
  satisfactionTurn: false,
  nudgeShown: false,
};

describe('useEventPopupSkip', () => {
  it('아무것도 나서지 않는 방문이면 건너뛰지 않는다', () => {
    const { result } = renderHook(() => useEventPopupSkip(quiet));

    expect(result.current).toBe(false);
  });

  it('프리뷰 차례였던 방문은 프리뷰가 그 자리에서 끝나도 계속 건너뛴다', () => {
    const { result, rerender } = renderHook(
      ({ previewTurn }) => useEventPopupSkip({ ...quiet, previewTurn }),
      { initialProps: { previewTurn: true } },
    );

    rerender({ previewTurn: false });

    expect(result.current).toBe(true);
  });
});
