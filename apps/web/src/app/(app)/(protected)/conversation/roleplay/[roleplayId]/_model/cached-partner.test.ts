// 세션 전 대기 화면에 세울 상대 — 홈이 받아 둔 시나리오 목록에서 찾는다
import { describe, expect, it } from 'vitest';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';

import { findCachedPartner } from './cached-partner';

const scenario = (id: number, characterId: string) =>
  ({ id, characterId }) as RoleplaySettings;

describe('findCachedPartner', () => {
  it('목록에 있는 시나리오면 그 상대를 돌려준다', () => {
    const scenarios = [scenario(3, 'marco'), scenario(7, 'teddy')];

    expect(findCachedPartner(scenarios, 7)).toBe('teddy');
  });

  it('받아 둔 목록이 없으면 상대를 모른다', () => {
    expect(findCachedPartner(undefined, 7)).toBeNull();
  });

  it('목록에 없는 시나리오면 상대를 모른다', () => {
    expect(findCachedPartner([scenario(3, 'marco')], 7)).toBeNull();
  });
});
