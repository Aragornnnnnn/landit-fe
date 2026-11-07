// 세션 전 대기 화면에 세울 상대 — 홈이 받아 둔 시나리오 목록에서 찾고, 없으면 모른다
import type { Partner } from '@/features/conversation/model/character-look';
import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { toPartnerId } from '@/features/small-talk/model/partner';

export const findCachedPartner = (
  scenarios: RoleplaySettings[] | undefined,
  roleplayId: number,
): Partner | null => {
  const scenario = scenarios?.find((item) => item.id === roleplayId);
  return scenario ? toPartnerId(scenario.characterId) : null;
};
