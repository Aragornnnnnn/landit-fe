// TalkScreen — 상대 답을 기다리는 동안 속마음 연출과 점 세 개 중 무엇을 보여 주는지 검증
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ConversationPhase } from '@/features/conversation/model/conversation-machine';

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

const toFlow = (phase: ConversationPhase, waitingForSound = false) =>
  ({
    phase,
    waitingForSound,
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

const lastLook = () =>
  (characterStage.mock.lastCall?.[0] as { look?: { posture: string } })?.look;

const dots = () => screen.queryByText('답을 생각하는 중');

const renderTalk = (
  phase: ConversationPhase,
  hasInnerThought?: boolean,
  waitingForSound?: boolean,
) =>
  render(
    <TalkScreen
      sessionId={1}
      partner="teddy"
      flow={toFlow(phase, waitingForSound)}
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

  it('속마음이 없는 대화는 소리가 시작될 때까지 점 세 개를 유지한다 — 소리 없이 글자부터 나오지 않게', () => {
    // When 답은 왔지만 음성을 준비하는 동안
    renderTalk('AI_SPEAKING', false, true);

    // Then
    expect(dots()).toBeTruthy();
    expect(screen.queryByText('How was your day?')).toBeNull();
    expect(lastLook()?.posture).toBe('idle');
  });

  it('소리가 시작되면 점이 사라지고 상대가 말하기 시작한다', () => {
    // When
    renderTalk('AI_SPEAKING', false, false);

    // Then
    expect(dots()).toBeNull();
    expect(lastLook()?.posture).toBe('speaking');
  });

  it('속마음이 있는 대화의 말하기 화면은 그대로다', () => {
    // When
    renderTalk('AI_SPEAKING', true, true);

    // Then
    expect(dots()).toBeNull();
  });
});
