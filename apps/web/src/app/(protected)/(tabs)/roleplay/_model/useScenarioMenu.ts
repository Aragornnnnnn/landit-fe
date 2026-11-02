// 카드 ⋯에서 이어지는 두 시트(더보기 → 삭제 확인)의 상태와 삭제 실행
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { useDeleteRoleplayScenarioMutation } from '@/features/roleplay/model/useDeleteRoleplayScenarioMutation';
import { showToast } from '@/shared/ui/toast';

export const useScenarioMenu = (scenarios: RoleplaySettings[] | null) => {
  const t = useTranslations('roleplay.delete');
  // 시트는 한 번에 하나만 뜬다 — 더보기에서 삭제를 누르면 더보기가 닫히고 확인이 열린다
  // id만 들고 목록에서 찾는다 — 연 뒤에 목록이 새로 와도 최신 값을 그리고, 사라진 시나리오면 닫힌다
  const [moreId, setMoreId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const findScenario = (id: number | null) =>
    scenarios?.find((scenario) => scenario.id === id) ?? null;
  const moreTarget = findScenario(moreId);
  const deleteTarget = findScenario(deleteId);
  const { mutate, isPending } = useDeleteRoleplayScenarioMutation();

  const askDelete = () => {
    setDeleteId(moreId);
    setMoreId(null);
  };

  const confirmDelete = () => {
    if (deleteId === null) return;
    mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
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
    openMore: (scenario: RoleplaySettings) => setMoreId(scenario.id),
    closeMore: () => setMoreId(null),
    askDelete,
    // 지우는 중엔 닫히지 않는다 — 닫힌 뒤에 결과 토스트만 뜨면 무엇이 지워졌는지 모른다
    closeDelete: () => {
      if (!isPending) setDeleteId(null);
    },
    confirmDelete,
  };
};
