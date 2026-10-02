// 완료 카드 앞면 배지(별점·기록 버튼)의 노출 계약 검증 — 뒤집힌 동안에는 그리지 않는다 (iOS backdrop-filter 잔상 방지)
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Scenario } from '../../lib/to-scenario';
import { ScenarioCard } from './ScenarioCard';

// 페이월 게이트는 구독 조회를 끌고 온다 — 이 화면 테스트에선 항상 열린 문으로 치환한다
vi.mock('@/features/subscription/model/usePaywallGate', () => ({
  usePaywallGate: () => ({ guard: (go: () => void) => go() }),
}));
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

afterEach(() => cleanup());

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
});
