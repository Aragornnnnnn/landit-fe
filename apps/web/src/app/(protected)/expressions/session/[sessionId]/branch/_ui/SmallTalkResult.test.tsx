// 대화 직후 화면 — 축하가 끝난 뒤 무엇을 보여줄지는 표현이 준비됐는지가 정한다
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ExpressionGenerationStatus,
  SmallTalkSessionDetailResponse,
} from '@/features/small-talk/api/small-talk';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import { SmallTalkResult } from './SmallTalkResult';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { nickname: '준서' } }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSessionQuery', () => ({
  useSmallTalkSessionQuery: vi.fn(),
}));

// 장면 연출은 이 테스트 관심사가 아니다 — 어느 장면이 섰는지와 리스트에 무엇이 넘어갔는지만 본다
const revealed = vi.hoisted(() => ({ expressions: [] as unknown[] }));
vi.mock('@/features/expression/ui/ExpressionStages', () => ({
  CelebrateStage: () => <div>축하</div>,
  AnalyzeStage: () => <div>만드는 중</div>,
  RevealStage: ({ expressions }: { expressions: unknown[] }) => {
    revealed.expressions = expressions;
    return <div>표현 리스트</div>;
  },
}));

const sessionQuery = vi.mocked(useSmallTalkSessionQuery);

const expressionOf = (expressionId: number, completed: boolean) => ({
  expressionId,
  displayOrder: expressionId,
  targetExpressionText: 'grab a coffee',
  baseExpressionMeaningText: '커피 한잔 하다',
  completed,
  lastRecommendedAt: null,
});

const setup = ({
  status = 'READY' as ExpressionGenerationStatus,
  generationStuck = false,
  error = null as Error | null,
  expressions = [expressionOf(1, false), expressionOf(2, false)],
} = {}) => {
  sessionQuery.mockReturnValue({
    session: error
      ? null
      : ({
          expressionGenerationStatus: status,
          expressions,
        } as SmallTalkSessionDetailResponse),
    error,
    isLoading: false,
    generationStuck,
    retry: vi.fn(),
  });
  render(<SmallTalkResult sessionId={7} celebrating />);
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// 축하가 지나가길 기다린다 (2.6초)
const skipCelebration = () => act(() => vi.advanceTimersByTime(3_000));

describe('SmallTalkResult', () => {
  it('대화를 막 끝내고 오면 먼저 축하를 보여준다', () => {
    setup();

    expect(screen.getByText('축하')).toBeInTheDocument();
  });

  it('표현 학습에서 돌아온 길이면 축하 없이 리스트만 편다', () => {
    // 표현 하나 배우고 나올 때마다 또 축하할 일은 아니다
    sessionQuery.mockReturnValue({
      session: {
        expressionGenerationStatus: 'READY',
        expressions: [expressionOf(1, true)],
      } as SmallTalkSessionDetailResponse,
      error: null,
      isLoading: false,
      generationStuck: false,
      retry: vi.fn(),
    });
    render(<SmallTalkResult sessionId={7} celebrating={false} />);

    expect(screen.getByText('표현 리스트')).toBeInTheDocument();
  });

  it('축하가 끝나도 표현이 아직이면 만드는 중을 보여준다', () => {
    setup({ status: 'PREPARING', expressions: [] });

    skipCelebration();

    expect(screen.getByText('만드는 중')).toBeInTheDocument();
  });

  it('표현이 준비되면 리스트를 편다', () => {
    setup();

    skipCelebration();

    expect(screen.getByText('표현 리스트')).toBeInTheDocument();
  });

  it('아직 안 배운 것 중 첫 표현만 열어 준다', () => {
    // 서버는 잠금을 안 내려준다 — 이미 배운 건 다시 볼 수 있게 열어 둔다
    setup({
      expressions: [
        expressionOf(1, true),
        expressionOf(2, false),
        expressionOf(3, false),
      ],
    });

    skipCelebration();

    expect(revealed.expressions).toEqual([
      expect.objectContaining({ expressionId: 1, locked: false }),
      expect.objectContaining({ expressionId: 2, locked: false }),
      expect.objectContaining({ expressionId: 3, locked: true }),
    ]);
  });

  it('조회가 막혀도 만드는 중에 갇히지 않는다', () => {
    // 완료되지 않은 세션이거나 통신이 막힌 경우 — 이유를 말하고 내보낸다
    setup({ error: new Error('404'), expressions: [] });

    skipCelebration();

    expect(screen.getByText(/불러오지 못했어요/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '돌아가기' }),
    ).toBeInTheDocument();
  });

  it('표현을 못 만들면 붙잡아 두지 않고 돌아갈 길을 준다', () => {
    setup({ status: 'FAILED', generationStuck: true, expressions: [] });

    skipCelebration();

    expect(screen.getByText(/조금 뒤에/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '돌아가기' }),
    ).toBeInTheDocument();
  });
});
