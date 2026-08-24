// 완료 카드 별점 배지의 노출 계약 검증 — 뒤집힌 동안에는 배지를 그리지 않는다 (iOS backdrop-filter 잔상 방지)
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Scenario } from '../../lib/to-scenario';
import { ScenarioCard } from './ScenarioCard';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
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

const renderCard = () =>
  render(
    <ScenarioCard
      scenario={completedScenario}
      onStart={vi.fn()}
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
});
