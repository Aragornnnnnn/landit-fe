// 시나리오 기록의 한 회차 — 그때 피드백을 기록 열람으로 다시 보이고, 나가면 기록 목록으로, 잠긴 상세는 페이월로
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ScenarioHistorySession } from '../../_api/scenario-history';
import { ScenarioSessionFeedback } from './ScenarioSessionFeedback';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  track: vi.fn(),
  retry: vi.fn(),
  premium: false,
  sessions: null as ScenarioHistorySession[] | null,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => ({ subscription: { premium: mocks.premium } }),
}));
vi.mock('@/features/scenario/model/useScenarioTitle', () => ({
  useScenarioTitle: () => '카페에서 주문하기',
}));
vi.mock('../../_model/useScenarioHistoryQuery', () => ({
  useScenarioHistoryQuery: () => ({
    sessions: mocks.sessions,
    error: null,
    retry: mocks.retry,
    isRefreshing: false,
  }),
}));
// 총평·상세는 자기 테스트가 있다 — 여기선 무엇을 넘기고 나가는 길이 어디인지만 본다
vi.mock('@/features/feedback/ui/flow/FeedbackContent', () => ({
  FeedbackContent: ({
    title,
    source,
    openDetail,
    onExit,
    onDetailLocked,
  }: {
    title: string;
    source: string;
    openDetail: boolean;
    onExit: () => void;
    onDetailLocked: () => void;
  }) => (
    <>
      <p>
        {title} {source}
      </p>
      {openDetail && <p>상세부터 연다</p>}
      <button onClick={onExit}>피드백 나가기</button>
      <button onClick={onDetailLocked}>잠긴 상세 보기</button>
    </>
  ),
}));

const session = (
  sessionId: number,
  feedback: Partial<NonNullable<ScenarioHistorySession['feedback']>> | null = {
    sessionId,
    detailFeedbackLocked: false,
  },
): ScenarioHistorySession => ({
  sessionId,
  startedAt: '2026-09-30T21:00:00',
  endedAt: '2026-09-30T21:10:00',
  messages: [],
  feedback: feedback as ScenarioHistorySession['feedback'],
});

afterEach(() => {
  cleanup();
  mocks.sessions = null;
  mocks.premium = false;
  vi.clearAllMocks();
});

describe('ScenarioSessionFeedback', () => {
  it('그 회차의 피드백을 기록 열람으로 보이고, 나가면 보던 날을 단 기록 목록으로 돌아간다', () => {
    mocks.sessions = [session(30)];
    render(
      <ScenarioSessionFeedback
        scenarioId={12}
        sessionId={30}
        date="2026-09-30"
        openDetail={false}
      />,
    );

    expect(screen.getByText('카페에서 주문하기 history')).toBeInTheDocument();
    fireEvent.click(screen.getByText('피드백 나가기'));
    expect(mocks.replace).toHaveBeenCalledWith(
      '/scenario/12/sessions?date=2026-09-30',
    );
  });

  it('잠긴 상세를 보려 하면 페이월로 보내고, 결제하면 이 회차의 상세로 돌아오게 한다', () => {
    mocks.sessions = [
      session(30, { sessionId: 30, detailFeedbackLocked: true }),
    ];
    render(
      <ScenarioSessionFeedback
        scenarioId={12}
        sessionId={30}
        openDetail={false}
      />,
    );

    fireEvent.click(screen.getByText('잠긴 상세 보기'));

    expect(mocks.push).toHaveBeenCalledWith(
      `/paywall?from=${encodeURIComponent('/scenario/12/sessions/30?detail=1')}&source=feedback_detail`,
    );
  });

  it('피드백이 저장되지 않은 회차는 그 사실을 알리고 기록으로 돌아갈 수 있다', () => {
    mocks.sessions = [session(30, null)];
    render(
      <ScenarioSessionFeedback
        scenarioId={12}
        sessionId={30}
        openDetail={false}
      />,
    );

    expect(screen.getByText(/피드백이 없어요/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '기록으로' }));
    expect(mocks.replace).toHaveBeenCalledWith('/scenario/12/sessions');
  });

  it('목록에 없는 회차면 찾지 못했다고 알린다 — 손으로 고친 주소', () => {
    mocks.sessions = [session(30)];
    render(
      <ScenarioSessionFeedback
        scenarioId={12}
        sessionId={999}
        openDetail={false}
      />,
    );

    expect(screen.getByText(/찾지 못했어요/)).toBeInTheDocument();
  });

  it('유료인데 잠긴 기록을 들고 있으면 한 번 다시 받는다 — 결제하고 돌아온 길', () => {
    mocks.premium = true;
    mocks.sessions = [
      session(30, { sessionId: 30, detailFeedbackLocked: true }),
    ];
    render(
      <ScenarioSessionFeedback
        scenarioId={12}
        sessionId={30}
        openDetail={false}
      />,
    );

    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });

  it('결제하고 돌아온 길이면 상세부터 열라고 넘긴다', () => {
    mocks.sessions = [session(30)];
    render(
      <ScenarioSessionFeedback scenarioId={12} sessionId={30} openDetail />,
    );

    expect(screen.getByText('상세부터 연다')).toBeInTheDocument();
  });
});
