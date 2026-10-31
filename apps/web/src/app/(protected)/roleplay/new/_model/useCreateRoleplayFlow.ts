// 시나리오 만들기 흐름 — 상대 고르기 → 세 칸 적기 → 생성 중.
// 고른 상대는 주소(?partner=)에 남겨 새로고침해도 유지한다. 단계는 히스토리를 쌓지 않고 바꾼다 —
// 만든 뒤 대화로 넘어가면 만들기 흐름이 통째로 히스토리에서 빠져, 대화에서 뒤로 가면 탭으로 간다
'use client';

import { useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
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
import { track } from '@/shared/analytics';
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
  // 마지막으로 받은 아이디어 — 다시 누르면 이것만 빼고 고르게 한다
  const lastIdeaIdRef = useRef<number | undefined>(undefined);
  // 아이디어로 채워 본 적이 있는가 — 받은 뒤 고쳐 썼어도 계측에선 아이디어를 쓴 것으로 본다
  const usedIdeaRef = useRef(false);
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
  // 고를 아이디어가 하나도 없으면(idea가 null) 받지 못한 것과 같게 알린다
  const requestIdea = () =>
    idea.mutate(lastIdeaIdRef.current, {
      onSuccess: ({ idea: received }) => {
        if (!received) {
          showToast(t('ideaFailToast'));
          return;
        }
        lastIdeaIdRef.current = received.id;
        usedIdeaRef.current = true;
        setDraft({
          myRole: received.userRole,
          partnerRole: received.aiRole,
          situation: received.situation,
        });
      },
      onError: () => showToast(t('ideaFailToast')),
    });

  const startCreate = () => {
    if (!canStart) return;
    setGenerating(true);
    create.mutate(
      {
        characterId: partner,
        userRole: draft.myRole.trim(),
        aiRole: draft.partnerRole.trim(),
        situation: draft.situation.trim(),
      },
      {
        // 만든 화면으로 돌아오지 않는다 — 대화에서 뒤로 가면 탭으로 간다
        onSuccess: (saved) => {
          track(EVENTS.ROLEPLAY_CREATED, {
            roleplay_id: saved.id,
            partner,
            used_idea: usedIdeaRef.current,
          });
          router.replace(roleplayTalkPath(saved.id));
        },
        // 적은 글은 그대로 두고 입력으로 돌려보낸다
        onError: () => {
          setGenerating(false);
          showToast(t('failToast'));
        },
      },
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
    showPartner,
    confirmPartner: () => router.replace(roleplayNewFormPath(partner)),
    editField,
    requestIdea,
    startCreate,
    goBack,
  };
};
