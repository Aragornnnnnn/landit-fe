// 시나리오 목록 상태 관리 — 카테고리 목록과 현재 선택 카테고리를 제공한다
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getScenarios, type ScenarioCategory } from '../api/list';
import { scenarioKeys } from './keys';

interface UseScenariosQueryOptions {
  // 표현학습을 건너뛰고 돌아온 직후인가 — 대화 완료 시점에 해금을 무효화해도, 서버의 실제
  // 반영이 그보다 늦을 수 있어 한 번 더 물어봐 흡수한다 (간헐적으로 방금 끝낸 시나리오가
  // 그대로 보이는 문제의 대응)
  justReturned?: boolean;
}

// 스킵 복귀 시 재조회까지 기다리는 시간
const UNLOCK_RETRY_DELAY_MS = 2000;

// preferScenarioId: 복귀(flip/card) 대상 시나리오가 있으면, 사용자가 아직 안 골랐을 때 그 카테고리를 기본으로 연다.
export const useScenariosQuery = (
  preferScenarioId?: number | null,
  options?: UseScenariosQueryOptions,
) => {
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

  // 마운트 시점 값으로 고정 — 이후 신호가 소비돼 꺼져도 이미 예약된 재조회는 그대로 실행된다
  const [justReturned] = useState(() => options?.justReturned ?? false);
  useEffect(() => {
    if (!justReturned) return;
    const id = setTimeout(() => void refetch(), UNLOCK_RETRY_DELAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- justReturned·refetch는 마운트 시점 값으로 충분
  }, []);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 복귀 대상 시나리오가 든 카테고리 (있으면 기본값 후보)
  const preferredCategory =
    preferScenarioId != null
      ? categories?.find((category) =>
          category.scenarios.some((s) => s.scenarioId === preferScenarioId),
        )
      : undefined;

  // 사용자가 명시적으로 고른 게 최우선, 없으면 복귀 대상 → 잠기지 않은 첫 → 첫 카테고리
  const selected =
    categories?.find((category) => category.categoryId === selectedId) ??
    preferredCategory ??
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
