// 대기 화면에 세울 상대 — 홈이 받아 둔 목록만 보고, 목록을 새로 받지는 않는다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { roleplayKeys } from '@/features/roleplay/model/keys';

import { useCachedRoleplayPartner } from './useCachedRoleplayPartner';

vi.mock('@/shared/auth/current-member', () => ({
  useCurrentUserId: () => 39,
}));

const renderWith = (scenarios?: RoleplaySettings[]) => {
  const client = new QueryClient();
  if (scenarios) client.setQueryData(roleplayKeys.scenarios(39), scenarios);
  return renderHook(() => useCachedRoleplayPartner(7), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
};

describe('useCachedRoleplayPartner', () => {
  it('홈이 받아 둔 목록에서 이 시나리오의 상대를 찾는다', () => {
    const { result } = renderWith([
      { id: 7, characterId: 'chloe' } as RoleplaySettings,
    ]);

    expect(result.current).toBe('chloe');
  });

  it('받아 둔 목록이 없으면 상대를 모른다', () => {
    const { result } = renderWith();

    expect(result.current).toBeNull();
  });
});
