// 시나리오 만들기 흐름 — 상대 고르기 → 세 칸 적기 → 생성 중.
// 고른 상대는 주소(?partner=)에 남긴다 — 셸 뒤로가기도 입력에서 상대 고르기로 한 단계만 되돌아가고, 적던 글은 화면에 남는다
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

import type { Partner } from '@/features/conversation/model/character-look';
import {
  EMPTY_DRAFT,
  isDraftReady,
  type RoleplayDraft,
} from '@/features/roleplay/model/roleplay-draft';
import { useCreateRoleplayScenarioMutation } from '@/features/roleplay/model/useCreateRoleplayScenarioMutation';
import { useRoleplayIdeaMutation } from '@/features/roleplay/model/useRoleplayIdeaMutation';
import { PARTNERS, toPartnerId } from '@/features/small-talk/model/partner';
import {
  backOrReplace,
  ROLEPLAY_NEW_PATH,
  ROLEPLAY_PATH,
  roleplayNewFormPath,
  roleplayTalkPath,
} from '@/shared/lib/routes';
import { showToast } from '@/shared/ui/toast';

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
  // 만드는 중은 주소에 두지 않는다 — 요청이 떠난 뒤엔 되돌아올 단계가 아니다
  const [generating, setGenerating] = useState(false);
  // 보이는 캐릭터가 곧 선택이다 — 따로 고르는 동작이 없다
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [draft, setDraft] = useState<RoleplayDraft>(EMPTY_DRAFT);
  const idea = useRoleplayIdeaMutation();
  const create = useCreateRoleplayScenarioMutation();
  const step = toStep(generating, partnerParam);
  // 입력 단계에선 주소의 상대가 정본이다 — 새로고침해도 고른 상대가 남는다
  const partner: Partner = partnerParam
    ? toPartnerId(partnerParam)
    : PARTNERS[partnerIndex].id;
  // 세 칸이 찼고 아이디어를 받는 중이 아닐 때만 — 버튼과 실행이 같은 값을 본다
  const canStart = isDraftReady(draft) && !idea.isPending;

  // 세 명이 끝이다 — 끝에서 더 넘기면 멈춘다(순환 없음)
  const showPartner = (index: number) =>
    setPartnerIndex(Math.min(Math.max(index, 0), PARTNERS.length - 1));

  const editField = (field: keyof RoleplayDraft, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  // 아이디어는 세 칸을 한 조합으로 덮는다 — 받는 동안엔 시작하기와 다시 받기가 잠긴다
  const requestIdea = () =>
    idea.mutate(undefined, {
      onSuccess: (received) =>
        setDraft({
          myRole: received.myRole,
          partnerRole: received.partnerRole,
          situation: received.situation,
        }),
      onError: () => showToast(t('ideaFailToast')),
    });

  const startCreate = () => {
    if (!canStart) return;
    setGenerating(true);
    create.mutate(
      {
        partner,
        myRole: draft.myRole.trim(),
        partnerRole: draft.partnerRole.trim(),
        situation: draft.situation.trim(),
      },
      {
        // 만든 화면으로 돌아오지 않는다 — 대화에서 뒤로 가면 탭으로 간다
        onSuccess: (scenario) =>
          router.replace(roleplayTalkPath(scenario.scenarioId)),
        // 적은 글은 그대로 두고 입력으로 돌려보낸다
        onError: () => {
          setGenerating(false);
          showToast(t('failToast'));
        },
      },
    );
  };

  // 입력에서는 상대 고르기로, 상대 고르기에서는 탭으로 — 만드는 중엔 헤더가 없다
  const goBack = () => {
    // 주소로 바로 들어왔으면 되돌아갈 상대 고르기가 히스토리에 없다
    if (step === 'form') backOrReplace(router, ROLEPLAY_NEW_PATH);
    else backOrReplace(router, ROLEPLAY_PATH);
  };

  return {
    step,
    partner,
    partnerIndex,
    draft,
    canStart,
    ideaPending: idea.isPending,
    showPartner,
    confirmPartner: () => router.push(roleplayNewFormPath(partner)),
    editField,
    requestIdea,
    startCreate,
    goBack,
  };
};
