// 첫 대화 판별 — 들어올 때의 달력에 첫 완료일이 없으면 첫 대화, 있으면 아니다. 필요 없을 땐 묻지 않는다
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWasFirstConversation } from './useWasFirstConversation';

const mocks = vi.hoisted(() => ({ getStreakCalendar: vi.fn() }));

vi.mock('@/features/streak/api/streak', () => ({
  getStreakCalendar: mocks.getStreakCalendar,
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient() }, children);

beforeEach(() => vi.clearAllMocks());

describe('useWasFirstConversation', () => {
  it('첫 완료일이 비어 있으면 첫 대화다', async () => {
    mocks.getStreakCalendar.mockResolvedValue({ firstActiveDate: null });

    const { result } = renderHook(() => useWasFirstConversation(true), {
      wrapper,
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('첫 완료일이 있으면 첫 대화가 아니다', async () => {
    mocks.getStreakCalendar.mockResolvedValue({
      firstActiveDate: '2026-09-01',
    });

    const { result } = renderHook(() => useWasFirstConversation(true), {
      wrapper,
    });

    await waitFor(() => expect(result.current).toBe(false));
  });

  it('필요 없으면(재대화·유료) 묻지 않고 모른다고 둔다', () => {
    const { result } = renderHook(() => useWasFirstConversation(false), {
      wrapper,
    });

    expect(result.current).toBeNull();
    expect(mocks.getStreakCalendar).not.toHaveBeenCalled();
  });
});
