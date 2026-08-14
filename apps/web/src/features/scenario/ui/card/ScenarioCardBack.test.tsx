// 카드 뒷면 전체 완료 축하 콘페티의 계약 검증 — 발동 조건과 모션 감소 설정
import { cleanup, render } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 가로 import 예외 — ScenarioCardBack 본체가 쓰는 expression 훅을 목킹하려면 같은 경로를 참조해야 한다
import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery';

import { ScenarioCardBack } from './ScenarioCardBack';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/features/expression/model/useExpressionsQuery', () => ({
  useExpressionsQuery: vi.fn(),
}));
vi.mock('@/features/expression/ui/ExpressionList', () => ({
  ExpressionList: () => null,
}));

const queryResult = (completedFlags: boolean[]) =>
  ({
    expressions: completedFlags.map((completed, i) => ({
      id: i + 1,
      completed,
    })),
    error: null,
    isLoading: false,
    retry: vi.fn(),
  }) as unknown as ReturnType<typeof useExpressionsQuery>;

beforeEach(() => vi.mocked(confetti).mockClear());
afterEach(() => cleanup());

describe('ScenarioCardBack', () => {
  it('표현을 전부 완료하고 자동으로 펼쳐지면 콘페티가 모션 감소 설정을 존중하며 터진다', () => {
    // Given 모든 표현을 완료한 카드가
    vi.mocked(useExpressionsQuery).mockReturnValue(queryResult([true, true]));

    // When 표현 마무리 직후 자동으로 펼쳐지면
    render(
      <ScenarioCardBack scenarioId={1} onBack={vi.fn()} autoFlip={true} />,
    );

    // Then 콘페티 세 발 전부 disableForReducedMotion이 켜져 있어야 한다
    const calls = vi.mocked(confetti).mock.calls;
    expect(calls).toHaveLength(3);
    for (const [options] of calls) {
      expect(options?.disableForReducedMotion).toBe(true);
    }
  });

  it('직접 뒤집어 연 카드에서는 콘페티가 터지지 않는다', () => {
    // Given 모든 표현을 완료한 카드라도
    vi.mocked(useExpressionsQuery).mockReturnValue(queryResult([true, true]));

    // When 자동 펼침이 아니라 직접 뒤집어 열면
    render(
      <ScenarioCardBack scenarioId={1} onBack={vi.fn()} autoFlip={false} />,
    );

    // Then 축하는 없다 — 방금 완료한 순간에만 축하한다
    expect(confetti).not.toHaveBeenCalled();
  });
});
