// 피드백 뒤 갈 곳 배선 — 재대화는 홈, 잠기지 않으면 표현 분기, 무료 첫 시나리오는 레벨 분석, 잠긴 상세는 페이월,
// 유료인데 잠긴 응답이면 다시 받는다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScenarioFeedbackFlow } from './ScenarioFeedbackFlow';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  track: vi.fn(),
  guard: vi.fn(),
  invalidateQueries: vi.fn(),
  locked: false,
  premium: false,
  feedback: null as { detailFeedbackLocked?: boolean } | null,
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/features/subscription/model/usePaywallGate', () => ({
  usePaywallGate: () => ({ guard: mocks.guard, locked: mocks.locked }),
}));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => ({
    subscription: { premium: mocks.premium },
    isError: false,
  }),
}));
vi.mock('@/features/feedback/model/useSessionFeedbackQuery', () => ({
  sessionFeedbackKey: (sessionId: number | null) => [
    'session-feedback',
    sessionId,
  ],
  useSessionFeedbackQuery: () => ({ feedback: mocks.feedback, error: null }),
}));
// 피드백 본편과 페이월 전 화면은 자기 테스트가 있다 — 여기선 누가 언제 불리는지만 본다
vi.mock('@/features/feedback/ui/FeedbackFlow', () => ({
  FeedbackFlow: ({
    title,
    openDetail,
    onExit,
    onDetailLocked,
  }: {
    title: string;
    openDetail: boolean;
    onExit: () => void;
    onDetailLocked: () => void;
  }) => (
    <>
      <button onClick={onExit}>{title} 피드백 마침</button>
      <button onClick={onDetailLocked}>잠긴 상세 보기</button>
      {openDetail && <p>상세부터 연다</p>}
    </>
  ),
}));
vi.mock('./PostConversationFlow', () => ({
  PostConversationFlow: ({ onFinish }: { onFinish: () => void }) => (
    <button onClick={onFinish}>학습 준비 마침</button>
  ),
}));

const renderFlow = (
  props: Partial<Parameters<typeof ScenarioFeedbackFlow>[0]> = {},
) =>
  render(
    <ScenarioFeedbackFlow
      scenarioId={7}
      sessionId={345}
      title="카페에서 주문하기"
      replay={false}
      openDetail={false}
      {...props}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  // 기본은 열린 게이트에 열린 상세 — 잠그는 경우만 각 테스트가 바꾼다
  mocks.guard.mockImplementation((go: () => void) => go());
  mocks.locked = false;
  mocks.premium = false;
  mocks.feedback = { detailFeedbackLocked: false };
});
afterEach(() => cleanup());

describe('ScenarioFeedbackFlow', () => {
  it('재대화면 피드백을 마치고 온 날 카드로 돌아간다', () => {
    // Given 지난 날 카드에서 다시 대화하고 피드백까지 봤을 때
    renderFlow({ replay: true, date: '2026-07-29' });

    // When 피드백을 마치면
    fireEvent.click(screen.getByText('카페에서 주문하기 피드백 마침'));

    // Then 표현 분기가 아니라 그 날 카드로 돌아간다
    expect(mocks.replace).toHaveBeenCalledWith('/scenario?date=2026-07-29');
    expect(mocks.guard).not.toHaveBeenCalled();
  });

  it('잠기지 않는 사람은 피드백을 마치면 게이트를 지나 표현 분기로 간다', () => {
    renderFlow();

    fireEvent.click(screen.getByText('카페에서 주문하기 피드백 마침'));

    expect(mocks.guard).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        entry: 'conversation_finished',
        returnTo: '/expressions/scenario/7/branch',
        replace: true,
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith(
      '/expressions/scenario/7/branch',
    );
  });

  it('무료 사용자의 첫 시나리오는 피드백 뒤 레벨 분석부터 지나고, 학습 준비의 CTA가 게이트를 지난다', () => {
    // Given 학습 문이 잠기는 무료 사용자인데 서버가 이 세션의 상세는 열어 줬을 때 (첫 시나리오)
    mocks.locked = true;
    renderFlow();

    // When 피드백을 마치면
    fireEvent.click(screen.getByText('카페에서 주문하기 피드백 마침'));

    // Then 바로 이동하지 않고 페이월 전 화면이 뜬다
    expect(mocks.guard).not.toHaveBeenCalled();
    expect(screen.getByText('학습 준비 마침')).toBeInTheDocument();

    // When 학습 준비의 CTA를 누르면 게이트가 표현 분기(무료면 페이월)로 보낸다
    fireEvent.click(screen.getByText('학습 준비 마침'));
    expect(mocks.guard).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ entry: 'conversation_finished' }),
    );
  });

  it('무료 사용자의 두 번째 시나리오부터는 총평을 마치면 홈으로 간다 — 레벨 화면이 또 뜨지 않는다', () => {
    mocks.locked = true;
    mocks.feedback = { detailFeedbackLocked: true };
    renderFlow();

    fireEvent.click(screen.getByText('카페에서 주문하기 피드백 마침'));

    expect(mocks.replace).toHaveBeenCalledWith('/scenario');
    expect(screen.queryByText('학습 준비 마침')).not.toBeInTheDocument();
  });

  it('잠긴 상세를 보려 하면 페이월로 가고, 돌아올 곳은 이 피드백의 상세다', () => {
    mocks.locked = true;
    mocks.feedback = { detailFeedbackLocked: true };
    renderFlow({ date: '2026-07-29' });

    fireEvent.click(screen.getByText('잠긴 상세 보기'));

    expect(mocks.track).toHaveBeenCalledWith('Paywall Gate Locked', {
      entry: 'feedback_detail',
    });
    expect(mocks.push).toHaveBeenCalledWith(
      `/paywall?from=${encodeURIComponent(
        '/conversation/scenario/7/feedback?session=345&date=2026-07-29&detail=1',
      )}`,
    );
  });

  it('결제하고 돌아온 길이면 상세부터 열라고 넘긴다', () => {
    renderFlow({ openDetail: true });

    expect(screen.getByText('상세부터 연다')).toBeInTheDocument();
  });

  it('유료인데 잠긴 응답을 들고 있으면 그 세션 피드백을 다시 받는다 — 무료일 때 받아 둔 것이다', () => {
    // Given 결제(또는 복원·다른 기기 결제)로 유료가 됐는데 캐시의 피드백은 아직 잠겨 있을 때
    mocks.premium = true;
    mocks.feedback = { detailFeedbackLocked: true };

    // When 피드백 화면에 들어오면
    renderFlow();

    // Then 그 세션의 피드백만 다시 받는다
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['session-feedback', 345],
    });
  });

  it('무료 사용자의 잠긴 응답은 다시 받지 않는다 — 다시 받아도 잠겨 있다', () => {
    mocks.premium = false;
    mocks.feedback = { detailFeedbackLocked: true };

    renderFlow();

    expect(mocks.invalidateQueries).not.toHaveBeenCalled();
  });

  it('피드백을 못 받은 무료 사용자는 마치면 홈으로 간다 — 첫 시나리오인지 모르는 채로 레벨 화면을 띄우지 않는다', () => {
    mocks.locked = true;
    mocks.feedback = null;
    renderFlow();

    fireEvent.click(screen.getByText('카페에서 주문하기 피드백 마침'));

    expect(mocks.replace).toHaveBeenCalledWith('/scenario');
    expect(screen.queryByText('학습 준비 마침')).not.toBeInTheDocument();
  });
});
