// 완료 카드 앞면 배지(별점·기록 버튼)의 노출 계약 검증 — 뒤집힌 동안에는 그리지 않는다 (iOS backdrop-filter 잔상 방지)
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import type { Scenario } from '../../lib/to-scenario';
import { ScenarioCard } from './ScenarioCard';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 주소만 보면 되니 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('@/shared/haptics', () => ({ haptic: vi.fn() }));
vi.mock('@/shared/ui/StarRating', () => ({
  StarRating: () => <div data-testid="star-rating" />,
}));
// 가로 import 예외 — 뒤집기 트리거(표현 배우기)와 복귀 트리거(뒷면 닫기)만 남긴 껍데기 목
vi.mock('./ExpressionProgress', () => ({
  ExpressionProgress: ({ onLearn }: { onLearn: () => void }) => (
    <button onClick={onLearn}>표현 배우기</button>
  ),
}));
vi.mock('./ScenarioCardBack', () => ({
  ScenarioCardBack: ({ onBack }: { onBack: () => void }) => (
    <button onClick={onBack}>카드 앞면으로</button>
  ),
}));

const completedScenario: Scenario = {
  scenarioId: 1,
  starRating: 3,
  scenarioTitle: '카페에서 주문하기',
  briefing: '음료를 주문해볼게요.',
  conversationGoal: '주문하기',
  difficulty: 'EASY',
  firstSpeaker: 'AI',
  thumbnailUrl: null,
  completed: true,
  locked: false,
  openingPreview: null,
};

const renderCard = ({
  scenario = completedScenario,
  date,
}: { scenario?: Scenario; date?: string } = {}) =>
  render(
    <ScenarioCard
      scenario={scenario}
      onStart={vi.fn()}
      date={date}
      expressions={{ completed: 1, total: 3 }}
    />,
  );

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ScenarioCard', () => {
  it('완료 카드 앞면에는 별점 배지가 보인다', () => {
    // Given/When 완료된 카드를 앞면으로 그리면
    renderCard();

    // Then 별점 배지가 있다
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
  });

  it('표현 학습으로 뒤집으면 별점 배지를 그리지 않는다', async () => {
    // Given 완료된 카드에서
    renderCard();

    // When 표현 학습으로 뒤집으면
    await userEvent.click(screen.getByRole('button', { name: '표현 배우기' }));

    // Then 별점 배지가 사라진다 — 앞면에 남겨두면 iOS에서 뒷면 위로 비쳐 보인다
    expect(screen.queryByTestId('star-rating')).not.toBeInTheDocument();
  });

  it('뒷면에서 앞면으로 되돌리면 별점 배지가 다시 보인다', async () => {
    // Given 뒤집힌 카드에서
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: '표현 배우기' }));

    // When 앞면으로 되돌리면
    await userEvent.click(
      screen.getByRole('button', { name: '카드 앞면으로' }),
    );

    // Then 별점 배지가 돌아온다
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
  });

  it('완료 카드 앞면 오른쪽 위에 그 시나리오의 기록으로 가는 버튼이 있다', () => {
    renderCard();

    expect(screen.getByRole('link', { name: '대화 기록' })).toHaveAttribute(
      'href',
      '/scenario/1/sessions',
    );
  });

  it('지난 날 카드의 기록 버튼은 그 날을 달고 간다 — 기록에서 나오면 그 날 카드로 돌아온다', () => {
    renderCard({ date: '2026-07-29' });

    expect(screen.getByRole('link', { name: '대화 기록' })).toHaveAttribute(
      'href',
      '/scenario/1/sessions?date=2026-07-29',
    );
  });

  it('아직 완료하지 않은 카드에는 기록 버튼이 없다 — 볼 기록이 없다', () => {
    renderCard({ scenario: { ...completedScenario, completed: false } });

    expect(
      screen.queryByRole('link', { name: '대화 기록' }),
    ).not.toBeInTheDocument();
  });

  it('뒤집힌 동안에는 기록 버튼을 그리지 않는다 — 별점 배지처럼 뒷면 위로 비치지 않게', async () => {
    renderCard();

    await userEvent.click(screen.getByRole('button', { name: '표현 배우기' }));

    expect(
      screen.queryByRole('link', { name: '대화 기록' }),
    ).not.toBeInTheDocument();
  });

  it('투어의 뒤집기 차례에 사용자가 먼저 뒤집어도 투어 단계를 넘긴다 — 자동 뒤집기를 기다리지 않아도', async () => {
    // Given 튜토리얼이 막 끝나 카드가 스스로 뒤집히기 전
    const onFlipped = vi.fn();
    render(
      <ScenarioCard
        scenario={completedScenario}
        onStart={vi.fn()}
        expressions={{ completed: 0, total: 3 }}
        tour={{
          screen: 'flip_card',
          onFlipped,
          onFreeOpened: vi.fn(),
          onTourEnd: vi.fn(),
        }}
      />,
    );

    // When 사용자가 먼저 표현 배우기를 누르면
    await userEvent.click(screen.getByText('표현 배우기'));

    // Then 뒤집기 단계를 한 번 넘긴다
    expect(onFlipped).toHaveBeenCalledTimes(1);
  });

  it('투어의 뒤집기 차례에 카드가 처음부터 뒷면으로 열려도 투어 단계를 넘긴다', () => {
    // Given 표현을 마치고 돌아온 길처럼 뒷면으로 펴진 채 열리는 카드
    const onFlipped = vi.fn();
    render(
      <ScenarioCard
        scenario={completedScenario}
        onStart={vi.fn()}
        autoFlip
        expressions={{ completed: 0, total: 3 }}
        tour={{
          screen: 'flip_card',
          onFlipped,
          onFreeOpened: vi.fn(),
          onTourEnd: vi.fn(),
        }}
      />,
    );

    // Then 뒤집기 단계를 넘긴다
    expect(onFlipped).toHaveBeenCalledTimes(1);
  });

  it('투어가 카드를 스스로 뒤집으면 표현 마무리 뒤 자동 뒤집기와 갈리게 trigger를 tour로 남긴다', () => {
    // Given 튜토리얼이 막 끝나 카드가 스스로 뒤집힐 차례
    vi.useFakeTimers();
    render(
      <ScenarioCard
        scenario={completedScenario}
        onStart={vi.fn()}
        expressions={{ completed: 0, total: 3 }}
        tour={{
          screen: 'flip_card',
          onFlipped: vi.fn(),
          onTourEnd: vi.fn(),
          onFreeOpened: vi.fn(),
        }}
      />,
    );

    // When 기다리면 카드가 뒤집힌다
    act(() => vi.advanceTimersByTime(500));

    // Then 투어가 뒤집었다고 한 번 남긴다
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Scenario Card Flipped', {
      scenario_id: 1,
      direction: 'back',
      trigger: 'tour',
    });
  });
});
