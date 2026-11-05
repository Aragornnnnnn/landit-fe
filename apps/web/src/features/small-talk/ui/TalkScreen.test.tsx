// TalkScreen — 상대 답을 기다리는 동안 속마음 연출과 점 세 개 중 무엇을 보여 주는지 검증
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ConversationPhase } from '@/features/conversation/model/conversation-machine';
import { runBackPress } from '@/shared/bridge/back-press';

import { TalkScreen, type TalkScreenFlow } from './TalkScreen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn() }),
}));
vi.mock('@/features/conversation/ui/flow/CharacterStage', () => ({
  CharacterStage: () => null,
}));
vi.mock('../model/useSpeakingLimit', () => ({
  useSpeakingLimit: () => ({ unlimited: true }),
}));

afterEach(() => cleanup());

const toFlow = (phase: ConversationPhase) =>
  ({
    phase,
    turnIndex: 1,
    turn: {
      aiMessage: 'How was your day?',
      aiTranslation: null,
      isUserOpening: false,
    },
    finishedThought: null,
    speech: {},
    replay: undefined,
    input: { transcript: 'It was great', keyboardMode: false },
    resend: null,
    pressClose: () => true,
    remainingMs: 0,
    speakingRatio: 1,
    summary: { speakingDurationMs: 0, exchangeCount: 0 },
  }) as unknown as TalkScreenFlow;

const dots = () => screen.queryByText('답을 생각하는 중');

const renderTalk = (phase: ConversationPhase, hasInnerThought?: boolean) =>
  render(
    <TalkScreen
      sessionId={1}
      partner="teddy"
      flow={toFlow(phase)}
      summaryPath="/summary"
      onShowSummary={vi.fn()}
      onExitRequested={vi.fn()}
      hasInnerThought={hasInnerThought}
    />,
  );

describe('TalkScreen 답 대기', () => {
  it('속마음이 있는 대화는 답을 기다리는 동안 화면을 덮는 연출을 띄운다', () => {
    // When 답을 기다리는 동안
    renderTalk('AI_THINKING');

    // Then 덮는 연출이 뜨고 점 세 개는 없다
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(dots()).not.toBeInTheDocument();
  });

  it('속마음이 없는 대화는 덮지 않고 말풍선 자리에 점 세 개를 띄운다', () => {
    // When 속마음이 없는 대화에서 답을 기다리는 동안
    renderTalk('AI_THINKING', false);

    // Then 지난 말 대신 점 세 개가 보이고, 덮는 연출은 없다
    expect(dots()).toBeInTheDocument();
    expect(screen.queryByText('How was your day?')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('속마음이 없는 대화도 기다리는 때가 아니면 상대 말이 그대로 보인다', () => {
    // When 내 차례일 때
    renderTalk('USER_READY', false);

    // Then 상대 말이 보이고 점 세 개는 없다
    expect(screen.getByText('How was your day?')).toBeInTheDocument();
    expect(dots()).not.toBeInTheDocument();
  });
});

describe('TalkScreen 뒤로가기', () => {
  const renderWithExit = (pressClose: () => boolean) => {
    const onExitRequested = vi.fn();
    const view = render(
      <TalkScreen
        sessionId={1}
        partner="teddy"
        flow={{ ...toFlow('USER_READY'), pressClose }}
        summaryPath="/summary"
        onShowSummary={vi.fn()}
        onExitRequested={onExitRequested}
      />,
    );
    return { ...view, onExitRequested };
  };

  it('대화 중 뒤로가기를 누르면 X처럼 종료 시트를 열고 화면을 떠나지 않는다', () => {
    // Given 물어봐야 하는 대화
    const { onExitRequested } = renderWithExit(() => true);

    // When 뒤로가기를 누르면
    const consumed = runBackPress();

    // Then 뒤로가기는 여기서 끝나고 시트를 연다
    expect(consumed).toBe(true);
    expect(onExitRequested).toHaveBeenCalledTimes(1);
  });

  it('흐름 훅이 알아서 보낸 대화는 뒤로가기에도 시트를 열지 않는다', () => {
    // Given X를 눌러도 물어보지 않는 대화 (끝났거나 나눈 말이 없다)
    const pressClose = vi.fn(() => false);
    const { onExitRequested } = renderWithExit(pressClose);

    // When 뒤로가기를 누르면
    runBackPress();

    // Then 흐름 훅에 맡기고 시트는 열지 않는다
    expect(pressClose).toHaveBeenCalledTimes(1);
    expect(onExitRequested).not.toHaveBeenCalled();
  });

  it('대화 화면을 떠나면 뒤로가기를 가로채지 않는다', () => {
    // Given 대화 화면을 떠났다
    const { unmount, onExitRequested } = renderWithExit(() => true);
    unmount();

    // When 뒤로가기를 누르면
    const consumed = runBackPress();

    // Then 다음 화면의 뒤로가기 처리로 넘어간다
    expect(consumed).toBe(false);
    expect(onExitRequested).not.toHaveBeenCalled();
  });
});

describe('TalkScreen 답 대기 중 뒤로가기', () => {
  const renderAt = (hasInnerThought: boolean) => {
    const pressClose = vi.fn(() => true);
    render(
      <TalkScreen
        sessionId={1}
        partner="teddy"
        flow={{ ...toFlow('AI_THINKING'), pressClose }}
        summaryPath="/summary"
        onShowSummary={vi.fn()}
        onExitRequested={vi.fn()}
        hasInnerThought={hasInnerThought}
      />,
    );
    return pressClose;
  };

  it('연출이 X를 가린 동안은 뒤로가기를 삼켜 보낸 답을 버리지 않는다', () => {
    const pressClose = renderAt(true);

    const handled = runBackPress();

    expect(handled).toBe(true);
    expect(pressClose).not.toHaveBeenCalled();
  });

  it('연출이 없는 대화는 답을 기다려도 X가 보이므로 뒤로가기를 받는다', () => {
    const pressClose = renderAt(false);

    runBackPress();

    expect(pressClose).toHaveBeenCalledTimes(1);
  });
});
