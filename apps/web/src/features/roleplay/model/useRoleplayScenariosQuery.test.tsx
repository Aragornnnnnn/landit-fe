// 내 시나리오 목록 — 한 장에 50개까지라, 다음 장이 있으면 끝까지 받아 하나로 이어 붙인다
// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as roleplayApi from '../api/roleplay';
import type { RoleplaySettings } from '../api/roleplay';
import { useRoleplayScenariosQuery } from './useRoleplayScenariosQuery';

vi.mock('../api/roleplay', () => ({ getRoleplays: vi.fn() }));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));

const getRoleplays = vi.mocked(roleplayApi.getRoleplays);

const item = (id: number) => ({ id }) as RoleplaySettings;

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    children,
  );

describe('useRoleplayScenariosQuery', () => {
  it('다음 장이 있으면 끝까지 받아 한 목록으로 이어 붙인다', async () => {
    getRoleplays
      .mockResolvedValueOnce({
        items: [item(1), item(2)],
        page: 0,
        size: 50,
        hasNext: true,
      })
      .mockResolvedValueOnce({
        items: [item(3)],
        page: 1,
        size: 50,
        hasNext: false,
      });

    const { result } = renderHook(() => useRoleplayScenariosQuery(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.scenarios).not.toBeNull());
    expect(result.current.scenarios?.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(getRoleplays.mock.calls.map(([page]) => page)).toEqual([0, 1]);
  });
});
