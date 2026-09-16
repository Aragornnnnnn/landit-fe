// 피드백 뒤 갈 곳 배선 — 재대화는 홈, 잠기지 않으면 표현 분기, 무료는 레벨 분석을 거쳐 게이트로
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScenarioFeedbackFlow } from './ScenarioFeedbackFlow';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  guard: vi.fn(),
  locksAfterConversation: false,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock('@/features/subscription/model/usePaywallGate', () => ({
  usePaywallGate: () => ({
    guard: mocks.guard,
    locksAfterConversation: mocks.locksAfterConversation,
  }),
}));
// 피드백 본편과 페이월 전 화면은 자기 테스트가 있다 — 여기선 누가 언제 불리는지만 본다
vi.mock('@/features/feedback/ui/FeedbackFlow', () => ({
  FeedbackFlow: ({ title, onExit }: { title: string; onExit: () => void }) => (
    <button onClick={onExit}>{title} 피드백 마침</button>
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
      {...props}
    />,
  );

beforeEach(() => {
  mocks.replace.mockReset();
  // 기본은 열린 게이트 — 잠그는 경우만 각 테스트가 바꾼다
  mocks.guard.mockReset().mockImplementation((go: () => void) => go());
  mocks.locksAfterConversation = false;
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
        conversationJustFinished: true,
        replace: true,
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith(
      '/expressions/scenario/7/branch',
    );
  });

  it('무료 사용자는 피드백 뒤 레벨 분석부터 지나고, 학습 준비의 CTA가 게이트를 지난다', () => {
    // Given 이 대화가 끝나면 게이트가 잠그는 무료 사용자일 때
    mocks.locksAfterConversation = true;
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

  it('세션이 없어도 피드백 흐름에 그대로 넘긴다 — 못 불러왔다는 안내는 피드백 흐름이 맡는다', () => {
    renderFlow({ sessionId: null });

    expect(
      screen.getByText('카페에서 주문하기 피드백 마침'),
    ).toBeInTheDocument();
  });
});
