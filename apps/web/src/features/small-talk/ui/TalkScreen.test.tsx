// TalkScreen — 대화 칸에 지난 대화·점 말풍선·속마음 줄을 언제 보여 주는지와 뒤로가기를 검증
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LogEntry } from '@/features/conversation/model/conversation-log';
import type { ConversationPhase } from '@/features/conversation/model/conversation-machine';
import type { BubbleThought } from '@/features/conversation/model/thought';
import { runBackPress } from '@/shared/bridge/back-press';

import { TalkScreen, type TalkScreenFlow } from './TalkScreen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn() }),
}));
const characterStage = vi.hoisted(() => vi.fn());
vi.mock('@/features/conversation/ui/flow/CharacterStage', () => ({
  CharacterStage: (props: unknown) => {
    characterStage(props);
    return null;
  },
}));
vi.mock('../model/useSpeakingLimit', () => ({
  useSpeakingLimit: () => ({ unlimited: true }),
}));

afterEach(() => cleanup());

const toFlow = (
  phase: ConversationPhase,
  waitingForSound = false,
  log: LogEntry[] = [],
  thought: BubbleThought | null = null,
) =>
  ({
    phase,
    waitingForSound,
    preparingAnswer: phase === 'AI_THINKING' || waitingForSound,
    turnIndex: 1,
    log,
    turn: {
      aiMessage: 'How was your day?',
      aiTranslation: null,
      isUserOpening: false,
      thought,
    },
    expressedThought: null,
    speech: {},
    replay: undefined,
    input: { transcript: 'It was great', keyboardMode: false },
    resend: null,
    pressClose: () => true,
    remainingMs: 0,
    speakingRatio: 1,
    summary: { speakingDurationMs: 0, exchangeCount: 0 },
  }) as unknown as TalkScreenFlow;

const lastLook = () =>
  (characterStage.mock.lastCall?.[0] as { look?: { posture: string } })?.look;

const dots = () => screen.queryByText('답을 생각하는 중');

const renderTalk = (
  phase: ConversationPhase,
  waitingForSound?: boolean,
  thought?: BubbleThought,
) =>
  render(
    <TalkScreen
      sessionId={1}
      partner="teddy"
      flow={toFlow(phase, waitingForSound, [], thought)}
      summaryPath="/summary"
      onShowSummary={vi.fn()}
      onExitRequested={vi.fn()}
    />,
  );

describe('TalkScreen 대화 칸', () => {
  it('끝난 턴의 상대 말과 내 말을 지금 상대 말 위에 쌓아 보여 준다', () => {
    render(
      <TalkScreen
        sessionId={1}
        partner="teddy"
        flow={toFlow('USER_READY', false, [
          { id: 0, speaker: 'PARTNER', text: 'Hi! How are you?' },
          { id: 1, speaker: 'ME', text: 'Pretty good, thanks.' },
        ])}
        summaryPath="/summary"
        onShowSummary={vi.fn()}
        onExitRequested={vi.fn()}
      />,
    );

    expect(screen.getByText('Hi! How are you?')).toBeInTheDocument();
    expect(screen.getByText('Pretty good, thanks.')).toBeInTheDocument();
    expect(screen.getByText('How was your day?')).toBeInTheDocument();
  });
});

describe('TalkScreen 답 대기', () => {
  it('답을 기다리는 동안엔 지금 상대 말 아래에 점 말풍선을 띄우고 화면을 덮지 않는다', () => {
    // When 답을 기다리는 동안
    renderTalk('AI_THINKING');

    // Then 방금 답한 상대 말은 그대로 두고 그 아래에 점 말풍선이 뜬다
    expect(screen.getByText('How was your day?')).toBeInTheDocument();
    expect(dots()).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('기다리는 때가 아니면 점 말풍선 없이 상대 말만 보인다', () => {
    // When 내 차례일 때
    renderTalk('USER_READY');

    // Then
    expect(screen.getByText('How was your day?')).toBeInTheDocument();
    expect(dots()).not.toBeInTheDocument();
  });

  it('대답이 와도 소리가 시작될 때까지 점 말풍선을 유지한다 — 소리 없이 글자부터 나오지 않게', () => {
    // When 답은 왔지만 음성을 준비하는 동안
    renderTalk('AI_SPEAKING', true);

    // Then
    expect(dots()).toBeTruthy();
    expect(screen.queryByText('How was your day?')).toBeNull();
    expect(lastLook()?.posture).toBe('idle');
  });

  it('소리가 시작되면 점이 사라지고 상대가 말하기 시작한다', () => {
    // When
    renderTalk('AI_SPEAKING', false);

    // Then
    expect(dots()).toBeNull();
    expect(lastLook()?.posture).toBe('speaking');
  });

  it('지금 상대 말풍선 맨 위에 속마음을 붙인다', () => {
    // When 속마음이 온 발화를 말하는 중
    renderTalk('AI_SPEAKING', false, {
      status: 'shown',
      text: '반갑네.',
      type: 'GOOD',
    });

    // Then
    expect(screen.getByText('반갑네.')).toBeInTheDocument();
  });

  it('답을 기다리는 동안에도 뒤로가기를 받는다 — 화면을 덮지 않아 X가 그대로 보인다', () => {
    // Given 답을 기다리는 중
    const pressClose = vi.fn(() => true);
    render(
      <TalkScreen
        sessionId={1}
        partner="teddy"
        flow={{ ...toFlow('AI_THINKING'), pressClose }}
        summaryPath="/summary"
        onShowSummary={vi.fn()}
        onExitRequested={vi.fn()}
      />,
    );

    // When
    runBackPress();

    // Then
    expect(pressClose).toHaveBeenCalledTimes(1);
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
