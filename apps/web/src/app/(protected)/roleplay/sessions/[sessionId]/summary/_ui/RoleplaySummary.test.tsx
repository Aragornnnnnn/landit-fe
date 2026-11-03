// 오늘의 롤플레이 — 막 끝내고 오면 축하를 먼저 보이고, 요약에는 다음 대화 질문이 없다. 나가는 길은 상세 피드백과 닫기(홈)
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySummaryResponse } from '@/features/roleplay/api/roleplay';
import { useRoleplaySummaryQuery } from '@/features/roleplay/model/useRoleplaySummaryQuery';

import { RoleplaySummary } from './RoleplaySummary';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('@/features/roleplay/model/useRoleplaySummaryQuery', () => ({
  useRoleplaySummaryQuery: vi.fn(),
}));
const track = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track }));
const filledEarlier = vi.hoisted(() => vi.fn(() => false));
vi.mock('@/features/streak/model/useFilledEarlier', () => ({
  useFilledEarlier: filledEarlier,
}));
// 축하의 열매 도장은 스트릭 조회에 기대는 연출이다 — 여기선 축하가 먼저 서는지만 본다
vi.mock('@/features/expression/ui/ExpressionStages', () => ({
  CELEBRATE_MS: 2600,
  CelebrateStage: ({ title }: { title: React.ReactNode }) => <h1>{title}</h1>,
}));

const summaryOf = (
  over: Partial<RoleplaySummaryResponse> = {},
): RoleplaySummaryResponse => ({
  sessionId: 7,
  title: '카페에서 커피 주문하기',
  pending: false,
  firstSession: false,
  headline: {
    text: '지난번보다 15초 더 말했어요.',
    subline: '말이 점점 길어지고 있어요!',
    pose: 'POINT',
  },
  comparison: {
    previousSessionId: 6,
    previousDate: '2026-10-28',
    current: { speakingMs: 47_000, turnCount: 4, maxWordsInTurn: 12 },
    previous: { speakingMs: 32_000, turnCount: 3, maxWordsInTurn: 8 },
  },
  growth: null,
  reusedExpressions: { pending: false, items: [] },
  correctionCount: 1,
  ...over,
});

const renderSummary = (
  summary: RoleplaySummaryResponse | null,
  { celebrate = false, error = null as Error | null } = {},
) => {
  vi.mocked(useRoleplaySummaryQuery).mockReturnValue({
    summary,
    error,
    isLoading: summary === null && error === null,
    waitExpired: false,
    retry: vi.fn(),
  });
  render(<RoleplaySummary sessionId={7} celebrate={celebrate} />);
};

afterEach(() => {
  cleanup();
  replace.mockClear();
  track.mockClear();
  vi.useRealTimers();
});

describe('RoleplaySummary', () => {
  it('오늘 열매를 이미 채웠으면 축하 없이 바로 요약을 보인다', () => {
    // Given 오늘을 이미 채우고 들어온 대화에서
    filledEarlier.mockReturnValueOnce(true);

    // When 막 끝내고 오면
    renderSummary(summaryOf(), { celebrate: true });

    // Then 축하 없이 요약이 보인다
    expect(screen.queryByText(/완료했어요/)).not.toBeInTheDocument();
    expect(
      screen.getByText('지난번보다 15초 더 말했어요.'),
    ).toBeInTheDocument();
  });

  it('막 끝내고 왔으면 축하를 먼저 보이고, 잠시 뒤 요약으로 넘어간다', () => {
    vi.useFakeTimers();
    renderSummary(summaryOf(), { celebrate: true });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '롤플레이 하나를잘 완료했어요!',
    );
    expect(screen.queryByText('오늘의 롤플레이')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2_600));

    expect(screen.getByText('오늘의 롤플레이')).toBeInTheDocument();
    expect(
      screen.getByText('지난번보다 15초 더 말했어요.'),
    ).toBeInTheDocument();
  });

  it('다시 들어온 길이면 축하 없이 바로 요약이다', () => {
    renderSummary(summaryOf());

    expect(screen.queryByText(/롤플레이 하나를/)).not.toBeInTheDocument();
    expect(screen.getByText('10월 28일 → 오늘')).toBeInTheDocument();
  });

  it('상세 피드백 보러가기를 누르면 그 대화의 기록으로 간다', async () => {
    renderSummary(summaryOf());

    await userEvent.click(
      screen.getByRole('button', { name: '상세 피드백 보러갈게요' }),
    );

    expect(replace).toHaveBeenCalledWith('/roleplay/sessions/7/messages');
  });

  it('분석을 기다리는 동안에도 통계와 대화 보기를 먼저 보인다', () => {
    renderSummary(
      summaryOf({
        pending: true,
        analysisStatus: 'PROCESSING',
        headline: null,
        growth: null,
        correctionCount: null,
      }),
    );

    expect(
      screen.queryByRole('status', { name: '오늘의 롤플레이를 불러오는 중' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('말한 시간')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '상세 피드백 보러갈게요' }),
    ).toBeInTheDocument();
    expect(screen.getByText('말한 내용을 분석하고 있어요')).toBeInTheDocument();
  });

  it('닫으면 표현 학습이 아니라 롤플레이 탭으로 간다', async () => {
    renderSummary(summaryOf());

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(replace).toHaveBeenCalledWith('/roleplay');
  });

  it('배운 표현 재사용을 아직 만드는 중이면 그 자리를 잡아 둔다', () => {
    renderSummary(
      summaryOf({ reusedExpressions: { pending: true, items: [] } }),
    );

    expect(
      screen.getByRole('status', { name: '배운 표현 재사용을 찾는 중' }),
    ).toBeInTheDocument();
  });

  it('요약을 못 받으면 다시 시도와 홈으로 가는 길을 준다', async () => {
    renderSummary(null, { error: new Error('') });

    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: '홈으로 돌아갈게요' }),
    );
    expect(replace).toHaveBeenCalledWith('/roleplay');
  });

  describe('계측', () => {
    it('요약이 서면 한 번 남긴다', () => {
      renderSummary(summaryOf());

      expect(track).toHaveBeenCalledWith('Roleplay Summary Viewed', {
        session_id: 7,
        just_finished: false,
        first_session: false,
        has_growth: false,
        reused_expression_count: 0,
        reused_expressions_pending: false,
        correction_count: 1,
      });
    });

    it('축하를 보는 동안엔 요약 노출로 세지 않는다', () => {
      renderSummary(summaryOf(), { celebrate: true });

      expect(track).not.toHaveBeenCalledWith(
        'Roleplay Summary Viewed',
        expect.anything(),
      );
    });

    it('요약을 못 받으면 실패로 남긴다', () => {
      renderSummary(null, { error: new Error('실패') });

      expect(track).toHaveBeenCalledWith('Roleplay Summary Failed', {
        session_id: 7,
        reason: 'error',
      });
    });

    it('상세 피드백으로 가면 교정 수와 함께 남긴다', async () => {
      renderSummary(summaryOf());

      await userEvent.click(
        screen.getByRole('button', { name: '상세 피드백 보러갈게요' }),
      );

      expect(track).toHaveBeenCalledWith('Roleplay Feedback Opened', {
        session_id: 7,
        correction_count: 1,
      });
    });

    it('닫으면 상세 피드백을 건너뛴 것으로 남긴다', async () => {
      renderSummary(summaryOf());

      await userEvent.click(screen.getByRole('button', { name: '닫기' }));

      expect(track).toHaveBeenCalledWith('Roleplay Feedback Skipped', {
        session_id: 7,
        trigger: 'close',
        correction_count: 1,
      });
    });

    it('요약을 못 받은 채 나가면 unavailable로 남긴다', async () => {
      renderSummary(null, { error: new Error('실패') });

      await userEvent.click(
        screen.getByRole('button', { name: '홈으로 돌아갈게요' }),
      );

      expect(track).toHaveBeenCalledWith('Roleplay Feedback Skipped', {
        session_id: 7,
        trigger: 'unavailable',
        correction_count: null,
      });
    });
  });
});
