// 시나리오 만들기 진행 — 저장, 세션 열기, 완성 순간 뒤 대화로 이동. 화면을 떠나면 이동도 세션 넘기기도 하지 않는다
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import type { Partner } from '@/features/conversation/model/character-look';
import type { RoleplaySettingsRequest } from '@/features/roleplay/api/roleplay';
import { isPremiumRequired } from '@/features/roleplay/model/premium-required';
import { saveRoleplayDraft } from '@/features/roleplay/model/roleplay-draft-store';
import { useCreateRoleplayScenarioMutation } from '@/features/roleplay/model/useCreateRoleplayScenarioMutation';
import { useRoleplaySessionHandoff } from '@/features/roleplay/model/useRoleplaySessionHandoff';
import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics/haptics';
import {
  backOrReplace,
  paywallPath,
  ROLEPLAY_PATH,
  roleplayNewFormPath,
  roleplayTalkPath,
} from '@/shared/lib/routes';
import { showToast } from '@/shared/ui/toast';

import { useDelayedFlag } from './useDelayedFlag';

// 완성 순간을 보여 주는 시간 — 이 뒤에 바로 대화로 넘어간다
const REVEAL_MS = 700;
// 이만큼 기다려도 응답이 없으면 돌아갈 길을 연다 — 요청에 시간 제한이 없어 그대로 두면 이 화면에 갇힌다
const SLOW_MS = 20_000;

export const useMakeScenario = () => {
  const router = useRouter();
  const t = useTranslations('roleplay.create');
  const create = useCreateRoleplayScenarioMutation();
  const handoff = useRoleplaySessionHandoff();
  const [generating, setGenerating] = useState(false);
  // 저장과 첫 발화까지 끝나 대화로 넘어가기 직전인 시나리오
  const [made, setMade] = useState<{ id: number; title: string } | null>(null);
  const slow = useDelayedFlag(generating && made === null, SLOW_MS);
  // 돌아가기나 뒤로 가기로 화면을 떠났는가 — 그 뒤 도착한 응답으로 사용자를 끌고 가지 않는다
  const leftRef = useRef(false);

  useEffect(() => {
    leftRef.current = false;
    return () => {
      leftRef.current = true;
    };
  }, []);

  const madeId = made?.id;
  useEffect(() => {
    if (madeId === undefined) return;
    haptic('success');
    const timer = setTimeout(
      () => router.replace(roleplayTalkPath(madeId)),
      REVEAL_MS,
    );
    return () => clearTimeout(timer);
  }, [madeId, router]);

  const start = async (body: RoleplaySettingsRequest, usedIdea: boolean) => {
    setGenerating(true);
    let saved;
    try {
      saved = await create.mutateAsync(body);
    } catch (cause) {
      const premiumRequired = isPremiumRequired(cause);
      track(EVENTS.ROLEPLAY_CREATE_FAILED, {
        partner: body.characterId,
        reason: premiumRequired ? 'premium_required' : 'error',
      });
      if (leftRef.current) return;
      if (premiumRequired) {
        track(EVENTS.PAYWALL_GATE_LOCKED, { source: 'roleplay' });
        saveRoleplayDraft({
          myRole: body.userRole,
          partnerRole: body.aiRole,
          situation: body.situation,
        });
        // 페이월로 가는 동안 입력 화면이 다시 보이지 않게 그대로 둔다
        router.push(
          paywallPath({
            source: 'roleplay',
            from: roleplayNewFormPath(body.characterId),
          }),
        );
        return;
      }
      // 적은 글은 그대로 두고 입력으로 돌려보낸다
      setGenerating(false);
      showToast(t('failToast'));
      return;
    }
    // 화면을 떠났어도 시나리오는 만들어졌으니 계측은 남긴다
    track(EVENTS.ROLEPLAY_CREATED, {
      roleplay_id: saved.id,
      partner: body.characterId,
      used_idea: usedIdea,
    });
    if (leftRef.current) return;
    try {
      await handoff.prepare(saved.id, () => !leftRef.current);
    } catch {
      // 완성했다고 하지 않고 대화 화면으로 넘긴다 — 거기서 다시 열어 보고 오류를 보여 준다
      if (!leftRef.current) router.replace(roleplayTalkPath(saved.id));
      return;
    }
    if (!leftRef.current) setMade(saved);
  };

  return {
    generating,
    madeTitle: made?.title ?? null,
    slow,
    start,
    // 오래 걸려 나간다 — 저장은 뒤에서 끝날 수 있어, 끝나면 탭에 카드가 선다
    leave: (partner: Partner) => {
      leftRef.current = true;
      track(EVENTS.ROLEPLAY_CREATE_ABANDONED, { partner });
      backOrReplace(router, ROLEPLAY_PATH);
    },
  };
};
