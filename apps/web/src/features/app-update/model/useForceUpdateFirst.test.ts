// useForceUpdateFirst — 강제 업데이트가 나서거나 나설지 모르는 동안 다른 자동 안내를 막는 판정 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAppUpdateCheck } from './useAppUpdateCheck';
import { useForceUpdateFirst } from './useForceUpdateFirst';

vi.mock('./useAppUpdateCheck');
const useAppUpdateCheckMock = vi.mocked(useAppUpdateCheck);

describe('useForceUpdateFirst', () => {
  it.each([
    ['강제 업데이트면', 'FORCE', false, true],
    ['정책을 아직 묻는 중이면', 'NONE', true, true],
    ['선택 업데이트면', 'SOFT', false, false],
    ['업데이트가 없으면', 'NONE', false, false],
  ] as const)(
    '%s 다른 안내를 막을지 정한다',
    (_, updateType, checking, held) => {
      useAppUpdateCheckMock.mockReturnValue({
        updateType,
        reason: null,
        checking,
      });

      const { result } = renderHook(() => useForceUpdateFirst());

      expect(result.current).toBe(held);
    },
  );
});
