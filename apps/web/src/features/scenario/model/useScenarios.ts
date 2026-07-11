// 시나리오 목록 상태 관리 — 카테고리 목록과 현재 선택 카테고리를 제공한다
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getScenarios, type ScenarioCategory } from '@/api/scenarios/list';
import { useAuthStore } from '@/store/auth-store';

import { scenarioKeys } from './keys';

export const useScenarios = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  // 정렬은 백엔드 보장(ORDER BY displayOrder) — 순차 해금 계산이 이 순서에 의존하는 백엔드 불변식이라 재정렬하지 않는다
  const { data, error, isPending, refetch } = useQuery({
    queryKey: scenarioKeys.list(userId),
    queryFn: getScenarios,
    select: (response) => response.categories,
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: userId !== null,
  });
  const categories = data ?? null;

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 명시적으로 고르기 전엔 잠기지 않은 첫 카테고리를 보여준다
  const selected =
    categories?.find((category) => category.categoryId === selectedId) ??
    categories?.find((category) => !category.categoryLocked) ??
    categories?.[0] ??
    null;

  const selectCategory = (category: ScenarioCategory) => {
    setSelectedId(category.categoryId);
  };

  const retry = () => {
    void refetch();
  };

  return {
    categories,
    selected,
    error,
    isLoading: isPending,
    selectCategory,
    retry,
  };
};
