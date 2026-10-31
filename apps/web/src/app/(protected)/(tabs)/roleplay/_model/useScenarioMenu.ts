// 카드 ⋯에서 이어지는 두 시트(더보기 → 삭제 확인)의 상태와 삭제 실행
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { RoleplayScenario } from '@/features/roleplay/api/roleplay';
import { useDeleteRoleplayScenarioMutation } from '@/features/roleplay/model/useDeleteRoleplayScenarioMutation';
import { showToast } from '@/shared/ui/toast';

export const useScenarioMenu = () => {
  const t = useTranslations('roleplay.delete');
  // 시트는 한 번에 하나만 뜬다 — 더보기에서 삭제를 누르면 더보기가 닫히고 확인이 열린다
  const [moreTarget, setMoreTarget] = useState<RoleplayScenario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleplayScenario | null>(
    null,
  );
  const { mutate, isPending } = useDeleteRoleplayScenarioMutation();

  const askDelete = () => {
    setDeleteTarget(moreTarget);
    setMoreTarget(null);
  };

  const confirmDelete = () => {
    if (deleteTarget === null) return;
    mutate(deleteTarget.scenarioId, {
      onSuccess: () => {
        setDeleteTarget(null);
        showToast(t('doneToast'));
      },
      // 실패하면 시트를 그대로 둔다 — 다시 누를 수 있게
      onError: () => showToast(t('failToast')),
    });
  };

  return {
    moreTarget,
    deleteTarget,
    deleting: isPending,
    openMore: setMoreTarget,
    closeMore: () => setMoreTarget(null),
    askDelete,
    // 지우는 중엔 닫히지 않는다 — 닫힌 뒤에 결과 토스트만 뜨면 무엇이 지워졌는지 모른다
    closeDelete: () => {
      if (!isPending) setDeleteTarget(null);
    },
    confirmDelete,
  };
};
