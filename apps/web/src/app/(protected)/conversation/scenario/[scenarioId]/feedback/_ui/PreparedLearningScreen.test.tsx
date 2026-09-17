// 학습 준비 화면 — 표현은 개수만큼 자리만 흐리게 깔고, 장면이 소개하며, CTA가 계측을 남기고 다음으로 넘긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PreparedLearningScreen,
  PreparedLearningView,
} from './PreparedLearningScreen';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  expressionsQuery: { expressions: null as { expressionId: number }[] | null },
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('next/image', () => ({ default: () => <span data-testid="landy" /> }));
// 파츠 SVG는 무겁고 이 화면의 계약이 아니다
vi.mock('@/features/conversation/ui/character/PartnerAvatar', () => ({
  PartnerAvatar: ({ partner }: { partner: string }) => (
    <span data-testid="presenter">{partner}</span>
  ),
}));
vi.mock('@/features/expression/model/useExpressionsQuery', () => ({
  useExpressionsQuery: () => mocks.expressionsQuery,
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 1, nickname: '준서' } }),
}));

afterEach(() => {
  cleanup();
  mocks.track.mockClear();
});

describe('PreparedLearningView', () => {
  it('받은 개수를 제목에 넣고, 흐린 자리는 보조기기에서 숨기며, 첫 장면은 래디가 준비했다고 말한다', () => {
    render(
      <PreparedLearningView
        scenarioId={7}
        nickname="준서"
        count={4}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText('4개')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText(/잠긴 학습 4개/)).toBeInTheDocument();
    expect(screen.getByTestId('slide-caption')).toHaveTextContent(
      '준서님 레벨에 딱 맞춰 드려요',
    );
    expect(screen.getByTestId('landy')).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Prepared Learning Viewed', {
      scenario_id: 7,
    });
  });

  it('닉네임이 없으면 첫 장면을 "내 레벨"로 말한다', () => {
    render(
      <PreparedLearningView
        scenarioId={7}
        nickname={null}
        count={4}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByTestId('slide-caption')).toHaveTextContent(
      '내 레벨에 딱 맞춰 드려요',
    );
  });

  it('CTA를 누르면 계측을 남기고 다음으로 넘긴다', () => {
    const onContinue = vi.fn();
    render(
      <PreparedLearningView
        scenarioId={7}
        nickname="준서"
        count={4}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '학습 시작하기' }));

    expect(mocks.track).toHaveBeenCalledWith('Prepared Learning Continued', {
      scenario_id: 7,
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe('PreparedLearningScreen 개수', () => {
  it('BE 표현 목록 길이를 개수로 쓴다 — 레벨마다 다르다', () => {
    mocks.expressionsQuery.expressions = [
      { expressionId: 1 },
      { expressionId: 2 },
      { expressionId: 3 },
      { expressionId: 4 },
      { expressionId: 5 },
      { expressionId: 6 },
    ];
    render(<PreparedLearningScreen scenarioId={7} onContinue={vi.fn()} />);

    expect(screen.getByText('6개')).toBeInTheDocument();
  });

  it('목록이 아직 없으면 4개로 둔다', () => {
    mocks.expressionsQuery.expressions = null;
    render(<PreparedLearningScreen scenarioId={7} onContinue={vi.fn()} />);

    expect(screen.getByText('4개')).toBeInTheDocument();
  });
});

describe('PreparedLearningScreen', () => {
  it('로그인한 사람의 닉네임을 뷰에 넘긴다', () => {
    render(<PreparedLearningScreen scenarioId={7} onContinue={vi.fn()} />);

    expect(screen.getByTestId('slide-caption')).toHaveTextContent(
      '준서님 레벨에 딱 맞춰 드려요',
    );
  });
});
