// ExpressionBranch — 시나리오 완료 축하를 보일지 건너뛸지 검증 (이미 채운 날이라도 받은 금액은 보여 준다)
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runBackPress } from '@/shared/bridge/back-press';

import { ExpressionBranch } from './ExpressionBranch';

const filledEarlier = vi.hoisted(() => vi.fn(() => false));
const completionEarn = vi.hoisted(() =>
  vi.fn<() => { earn: { earnedWon: number } | null }>(() => ({ earn: null })),
);

const replace = vi.hoisted(() => vi.fn());
const track = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('@/shared/analytics', () => ({ track }));
vi.mock('@/features/streak/model/useFilledEarlier', () => ({
  useFilledEarlier: filledEarlier,
}));
vi.mock('@/features/reward/model/useCompletionEarn', () => ({
  useCompletionEarn: completionEarn,
}));
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ guard: vi.fn() }),
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: () => null,
}));
vi.mock('../model/useExpressionsQuery', () => ({
  useExpressionsQuery: () => ({
    expressions: [],
    error: null,
    retry: vi.fn(),
  }),
}));
vi.mock('./ExpressionStages', () => ({
  CelebrateStage: () => <div>축하</div>,
  AnalyzeStage: () => <div>분석</div>,
  RevealStage: () => <div>표현 리스트</div>,
}));

afterEach(() => {
  cleanup();
  replace.mockClear();
  track.mockClear();
  filledEarlier.mockReset().mockReturnValue(false);
  completionEarn.mockReset().mockReturnValue({ earn: null });
});

describe('ExpressionBranch 축하', () => {
  it('오늘 첫 대화면 축하를 먼저 보인다', () => {
    render(<ExpressionBranch scenarioId={1} />);

    expect(screen.getByText('축하')).toBeInTheDocument();
  });

  it('오늘 열매를 이미 채웠으면 축하 없이 분석으로 넘어간다', () => {
    filledEarlier.mockReturnValue(true);

    render(<ExpressionBranch scenarioId={1} />);

    expect(screen.queryByText('축하')).not.toBeInTheDocument();
    expect(screen.getByText('분석')).toBeInTheDocument();
  });

  it('이미 채운 날이라도 받은 금액이 있으면 축하를 보인다', () => {
    // 자정을 넘겨 끝낸 대화는 시작한 날 몫으로 쌓인다 — 금액은 놓치면 안 된다
    filledEarlier.mockReturnValue(true);
    completionEarn.mockReturnValue({ earn: { earnedWon: 1000 } });

    render(<ExpressionBranch scenarioId={1} />);

    expect(screen.getByText('축하')).toBeInTheDocument();
  });
});

describe('ExpressionBranch 안드로이드 뒤로가기', () => {
  it('뒤로가기를 누르면 X처럼 학습 건너뜀을 남기고 시나리오로 돌아간다', () => {
    render(<ExpressionBranch scenarioId={1} />);

    runBackPress();

    expect(track).toHaveBeenCalledWith(
      'Expression Learning Skipped',
      expect.objectContaining({ scenario_id: 1 }),
    );
    expect(replace).toHaveBeenCalledWith('/scenario');
  });
});

describe('ExpressionBranch 연타', () => {
  it('다음 화면이 뜨기 전에 또 눌러도 건너뜀을 한 번만 남긴다', () => {
    render(<ExpressionBranch scenarioId={1} />);

    runBackPress();
    runBackPress();

    expect(
      track.mock.calls.filter(
        ([name]) => name === 'Expression Learning Skipped',
      ),
    ).toHaveLength(1);
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
