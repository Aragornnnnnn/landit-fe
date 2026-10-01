// 구독 관리 링크를 열 스토어 — 결제 스토어가 우선이고, 없으면 셸 플랫폼, 브라우저는 iOS
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStorePlatform } from './useStorePlatform';

const mocks = vi.hoisted(() => ({
  context: null as { platform: 'ios' | 'android' } | null,
}));

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: () => mocks.context,
}));

beforeEach(() => {
  mocks.context = null;
});

describe('useStorePlatform', () => {
  it('결제한 스토어가 있으면 셸 플랫폼보다 그쪽을 따른다', () => {
    mocks.context = { platform: 'ios' };

    const { result } = renderHook(() => useStorePlatform('PLAY_STORE'));

    expect(result.current).toBe('android');
  });

  it('결제 스토어를 모르면 셸 플랫폼을 쓴다', () => {
    mocks.context = { platform: 'android' };

    const { result } = renderHook(() => useStorePlatform(null));

    expect(result.current).toBe('android');
  });

  it('브라우저에서는 iOS로 연다', () => {
    const { result } = renderHook(() => useStorePlatform(undefined));

    expect(result.current).toBe('ios');
  });
});
