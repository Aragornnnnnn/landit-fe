// 시나리오 만들기 흐름 — 상대 고르기 → 세 칸 적기 → 생성 중.
// 고른 상대는 주소(?partner=)에 남겨 새로고침해도 유지한다. 단계는 히스토리를 쌓지 않고 바꾼다 —
// 만든 뒤 대화로 넘어가면 만들기 흐름이 통째로 히스토리에서 빠져, 대화에서 뒤로 가면 탭으로 간다
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import type { Partner } from '@/features/conversation/model/character-look';
import type { RoleplayIdea } from '@/features/roleplay/api/roleplay';
import {
  EMPTY_DRAFT,
  isDraftReady,
  type RoleplayDraft,
} from '@/features/roleplay/model/roleplay-draft';
import {
  clearRoleplayDraft,
  readRoleplayDraft,
  saveRoleplayDraft,
} from '@/features/roleplay/model/roleplay-draft-store';
import { useRoleplayGate } from '@/features/roleplay/model/useRoleplayGate';
import { useRoleplayIdeaMutation } from '@/features/roleplay/model/useRoleplayIdeaMutation';
import { PARTNERS, toPartnerId } from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';
import { useCurrentUserId } from '@/shared/auth/current-member';
import {
  backOrReplace,
  ROLEPLAY_NEW_PATH,
  ROLEPLAY_PATH,
  roleplayNewFormPath,
} from '@/shared/lib/routes';
import { showToast } from '@/shared/ui/toast';

import { wrapCarouselIndex } from './partner-carousel';
import { useMakeScenario } from './useMakeScenario';

export type CreateStep = 'partner' | 'form' | 'generating';

const toStep = (
  generating: boolean,
  partnerParam: string | null,
): CreateStep => {
  if (generating) return 'generating';
  return partnerParam ? 'form' : 'partner';
};

export const useCreateRoleplayFlow = () => {
  const router = useRouter();
  const t = useTranslations('roleplay.create');
  const partnerParam = useSearchParams().get('partner');
  const userId = useCurrentUserId();
  const gate = useRoleplayGate();
  const maker = useMakeScenario({
    freeUser: gate.freeUser,
    onAccessChanged: gate.refresh,
  });
  // 보이는 캐릭터가 곧 선택이다 — 따로 고르는 동작이 없다
  // 새로고침한 입력에서 뒤로 와도 주소에 있던 상대에서 시작한다
  const [partnerIndex, setPartnerIndex] = useState(() =>
    partnerParam
      ? PARTNERS.findIndex((item) => item.id === toPartnerId(partnerParam))
      : 0,
  );
  // 페이월에서 돌아왔으면 적던 글로 시작한다
  const [draft, setDraft] = useState<RoleplayDraft>(
    () => readRoleplayDraft(userId) ?? EMPTY_DRAFT,
  );
  const idea = useRoleplayIdeaMutation();
  // 마지막으로 받은 아이디어 — 다시 누르면 이것만 빼고 고르게 하고, 고쳐 썼는지도 이것과 견준다
  const lastIdeaRef = useRef<RoleplayIdea | null>(null);
  const ideaRequestCountRef = useRef(0);
  // 아이디어로 채워 본 적이 있는가 — 받은 뒤 고쳐 썼어도 계측에선 아이디어를 쓴 것으로 본다
  const usedIdeaRef = useRef(false);
  // 아이디어로 칸을 채운 횟수 — 칸마다 빛이 한 번 지나가는 신호다
  const [ideaFillCount, setIdeaFillCount] = useState(0);
  // 만드는 중은 주소에 두지 않는다 — 요청이 떠난 뒤엔 되돌아올 단계가 아니다
  const step = toStep(maker.generating, partnerParam);
  // 입력 단계에선 주소의 상대가 정본이다 — 새로고침해도 고른 상대가 남는다
  const partner: Partner = partnerParam
    ? toPartnerId(partnerParam)
    : PARTNERS[partnerIndex].id;
  // 세 칸이 찼고 아이디어를 받는 중이 아닐 때만 — 버튼과 실행이 같은 값을 본다
  const canStart = isDraftReady(draft) && !idea.isPending;

  useEffect(() => clearRoleplayDraft(), []);

  // 끝이 없다 — 마지막 다음은 처음, 처음 이전은 마지막이다
  const movePartner = (step: -1 | 1) =>
    setPartnerIndex((current) =>
      wrapCarouselIndex(current + step, PARTNERS.length),
    );

  const editField = (field: keyof RoleplayDraft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  // 아이디어는 세 칸을 한 조합으로 덮는다 — 받는 동안엔 시작하기와 다시 받기가 잠긴다
  // 고를 아이디어가 하나도 없으면(idea가 null) 받지 못한 것과 같게 알린다
  const requestIdea = () => {
    ideaRequestCountRef.current += 1;
    track(EVENTS.ROLEPLAY_IDEA_REQUESTED, {
      partner,
      request_count: ideaRequestCountRef.current,
    });
    idea.mutate(lastIdeaRef.current?.id, {
      onSuccess: ({ idea: received }) => {
        if (!received) {
          track(EVENTS.ROLEPLAY_IDEA_FAILED, { partner, reason: 'empty' });
          showToast(t('ideaFailToast'));
          return;
        }
        track(EVENTS.ROLEPLAY_IDEA_APPLIED, { partner, idea_id: received.id });
        lastIdeaRef.current = received;
        usedIdeaRef.current = true;
        setIdeaFillCount((count) => count + 1);
        setDraft({
          myRole: received.userRole,
          partnerRole: received.aiRole,
          situation: received.situation,
        });
      },
      onError: () => {
        track(EVENTS.ROLEPLAY_IDEA_FAILED, { partner, reason: 'error' });
        showToast(t('ideaFailToast'));
      },
    });
  };

  const toIdeaUsage = () => {
    const lastIdea = lastIdeaRef.current;
    if (!lastIdea) return { used_idea: usedIdeaRef.current };
    return {
      used_idea: usedIdeaRef.current,
      idea_id: lastIdea.id,
      idea_edited:
        draft.myRole !== lastIdea.userRole ||
        draft.partnerRole !== lastIdea.aiRole ||
        draft.situation !== lastIdea.situation,
    };
  };

  const confirmPartner = () => {
    track(EVENTS.ROLEPLAY_PARTNER_SELECTED, { partner });
    router.replace(roleplayNewFormPath(partner));
  };

  // 무료 기회를 쓴 사용자는 페이월로 간다 — 돌아와도 적던 글이 남는다. 아이디어는 비용이 없어 막지 않는다
  const startCreate = () => {
    if (!canStart) return;
    if (gate.locked) saveRoleplayDraft(draft, userId);
    gate.guard(
      () => {
        void maker.start(
          {
            characterId: partner,
            userRole: draft.myRole.trim(),
            aiRole: draft.partnerRole.trim(),
            situation: draft.situation.trim(),
          },
          toIdeaUsage(),
        );
      },
      { source: 'roleplay_create', returnTo: roleplayNewFormPath(partner) },
    );
  };

  // 입력에서는 상대 고르기로, 상대 고르기에서는 탭으로 — 만드는 중엔 헤더가 없다.
  // 입력 단계는 상대 고르기 자리를 바꿔 들어온 것이라 히스토리에 상대 고르기가 없다
  const goBack = () => {
    if (step === 'form') router.replace(ROLEPLAY_NEW_PATH);
    else backOrReplace(router, ROLEPLAY_PATH);
  };

  return {
    step,
    partner,
    partnerIndex,
    draft,
    canStart,
    ideaPending: idea.isPending,
    movePartner,
    confirmPartner,
    editField,
    requestIdea,
    startCreate,
    goBack,
    madeTitle: maker.madeTitle,
    slow: maker.slow,
    ideaFillCount,
    leaveMaking: () => maker.leave(partner),
  };
};
