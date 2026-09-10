// 학습 준비 화면 — 표현은 자리만 흐리게 깔고, 장면이 소개하며, CTA가 계측을 남기고 다음으로 넘긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PreparedLearningScreen,
  PreparedLearningView,
} from './PreparedLearningScreen';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('next/image', () => ({ default: () => <span data-testid="landy" /> }));
// 파츠 SVG는 무겁고 이 화면의 계약이 아니다
vi.mock('@/features/conversation/ui/character/PartnerAvatar', () => ({
  PartnerAvatar: ({ partner }: { partner: string }) => (
    <span data-testid="presenter">{partner}</span>
  ),
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
  it('개수 4를 제목에 넣고, 흐린 자리는 보조기기에서 숨기며, 첫 장면은 래디가 준비했다고 말한다', () => {
    render(
      <PreparedLearningView
        scenarioId={7}
        nickname="준서"
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText('4개')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText('잠긴 학습 4개')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
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
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      '내 레벨에 딱 맞춰 드려요',
    );
  });

  it('CTA를 누르면 계측을 남기고 다음으로 넘긴다', () => {
    const onContinue = vi.fn();
    render(
      <PreparedLearningView
        scenarioId={7}
        nickname="준서"
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

describe('PreparedLearningScreen', () => {
  it('로그인한 사람의 닉네임을 뷰에 넘긴다', () => {
    render(<PreparedLearningScreen scenarioId={7} onContinue={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      '준서님 레벨에 딱 맞춰 드려요',
    );
  });
});
