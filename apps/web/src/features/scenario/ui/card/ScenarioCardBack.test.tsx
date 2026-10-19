// 카드 뒷면 전체 완료 축하 콘페티의 계약 검증 — 발동 조건과 모션 감소 설정
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 가로 import 예외 — ScenarioCardBack 본체가 쓰는 expression 훅을 목킹하려면 같은 경로를 참조해야 한다
import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery';

import { ScenarioCardBack } from './ScenarioCardBack';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  // 기본은 열린 문 — 첫 표현 투어 테스트만 잠근다
  guard: vi.fn((go: () => void) => go()),
}));
// 페이월 게이트는 구독·스트릭 조회를 끌고 온다 — 이 화면 테스트에선 목으로 치환한다
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ decision: 'open', guard: mocks.guard }),
}));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/features/expression/model/useExpressionsQuery', () => ({
  useExpressionsQuery: vi.fn(),
}));
// 목록은 무료로 열어 준 표현과 누를 거리만 드러낸다
vi.mock('@/features/expression/ui/ExpressionList', () => ({
  ExpressionList: ({
    expressions,
    onSelect,
    premiumLocked,
    freeTrialExpressionId,
  }: {
    expressions: { expressionId: number }[];
    onSelect: (id: number) => void;
    premiumLocked?: boolean;
    freeTrialExpressionId?: number;
  }) => (
    <>
      {premiumLocked && freeTrialExpressionId !== undefined && (
        <p>무료 {freeTrialExpressionId}</p>
      )}
      {expressions.map(({ expressionId }) => (
        <button key={expressionId} onClick={() => onSelect(expressionId)}>
          표현 {expressionId}
        </button>
      ))}
    </>
  ),
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

beforeEach(() => {
  vi.mocked(confetti).mockClear();
  mocks.push.mockClear();
  mocks.guard.mockClear();
  mocks.guard.mockImplementation((go: () => void) => go());
});
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

  const freeTrialList = () =>
    vi.mocked(useExpressionsQuery).mockReturnValue({
      expressions: [
        { expressionId: 11, completed: false, locked: false, freeTrial: true },
        { expressionId: 12, completed: false, locked: true },
      ],
      error: null,
      isLoading: false,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useExpressionsQuery>);

  it('첫 표현 투어 중에는 서버가 열어 준 무료 표현을 무료로 표시한다', () => {
    // Given 무료 표현이 있는 카드의 투어 차례
    freeTrialList();

    // When 뒷면이 열리면
    render(<ScenarioCardBack scenarioId={1} onBack={vi.fn()} freeTour />);

    // Then 목록이 그 표현을 무료로 표시한다
    expect(screen.getByText('무료 11')).toBeInTheDocument();
  });

  it('무료 표현을 누르면 게이트를 거치지 않고 학습으로 간다', () => {
    mocks.guard.mockImplementation(() => {});
    freeTrialList();
    render(<ScenarioCardBack scenarioId={1} onBack={vi.fn()} freeTour />);

    fireEvent.click(screen.getByText('표현 11'));

    expect(mocks.guard).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/expressions/scenario/1/11');
  });

  it('무료가 아닌 표현을 누르면 게이트가 막는다', () => {
    mocks.guard.mockImplementation(() => {});
    freeTrialList();
    render(<ScenarioCardBack scenarioId={1} onBack={vi.fn()} freeTour />);

    fireEvent.click(screen.getByText('표현 12'));

    expect(mocks.guard).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('투어가 끝난 뒤에도 서버가 열어 준 무료 표현은 페이월 없이 연다 — 무료 표시만 없다', () => {
    mocks.guard.mockImplementation(() => {});
    vi.mocked(useExpressionsQuery).mockReturnValue({
      expressions: [
        { expressionId: 11, completed: true, locked: false, freeTrial: true },
        { expressionId: 12, completed: false, locked: false },
      ],
      error: null,
      isLoading: false,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useExpressionsQuery>);
    render(<ScenarioCardBack scenarioId={1} onBack={vi.fn()} />);

    expect(screen.queryByText(/무료/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('표현 11'));
    expect(mocks.guard).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/expressions/scenario/1/11');
    fireEvent.click(screen.getByText('표현 12'));
    expect(mocks.guard).toHaveBeenCalledTimes(1);
  });

  it('투어 중인데 서버가 이 카드에 무료 표현을 열어 주지 않았으면 투어를 끝낸다', () => {
    vi.mocked(useExpressionsQuery).mockReturnValue({
      expressions: [{ expressionId: 11, completed: false, locked: false }],
      error: null,
      isLoading: false,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useExpressionsQuery>);
    const onTourEnd = vi.fn();
    render(
      <ScenarioCardBack
        scenarioId={1}
        onBack={vi.fn()}
        freeTour
        onTourEnd={onTourEnd}
      />,
    );

    expect(onTourEnd).toHaveBeenCalledTimes(1);
  });

  it('투어 중인데 무료 표현을 이미 끝냈으면(투어 밖에서 마친 경우) 투어를 끝낸다', () => {
    vi.mocked(useExpressionsQuery).mockReturnValue({
      expressions: [
        { expressionId: 11, completed: true, locked: false, freeTrial: true },
      ],
      error: null,
      isLoading: false,
      retry: vi.fn(),
    } as unknown as ReturnType<typeof useExpressionsQuery>);
    const onTourEnd = vi.fn();
    render(
      <ScenarioCardBack
        scenarioId={1}
        onBack={vi.fn()}
        freeTour
        onTourEnd={onTourEnd}
      />,
    );

    expect(onTourEnd).toHaveBeenCalledTimes(1);
  });
});
