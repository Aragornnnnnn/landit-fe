// 대화 보기 — 조회 중엔 스켈레톤이 서고, 내 말풍선 아래엔 교정 카드와 배운 표현 태그가 조건에 따라 붙는다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  SmallTalkHistoryMessage,
  SmallTalkSessionDetailResponse,
} from '@/features/small-talk/api/small-talk';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import { SmallTalkTranscript } from './SmallTalkTranscript';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSessionQuery', () => ({
  useSmallTalkSessionQuery: vi.fn(),
}));

const sessionQuery = vi.mocked(useSmallTalkSessionQuery);

const messageOf = (
  overrides: Partial<SmallTalkHistoryMessage>,
): SmallTalkHistoryMessage => ({
  messageId: 1,
  turnNumber: 1,
  messageSequence: 1,
  role: 'USER',
  content: "I'm working out now.",
  translatedContent: null,
  emotion: null,
  innerThought: null,
  innerThoughtType: null,
  ...overrides,
});

const sessionOf = (
  messages: SmallTalkHistoryMessage[],
): SmallTalkSessionDetailResponse => ({
  sessionId: 7,
  title: 'Cardio workout',
  startedAt: '2026-09-10T09:50:00',
  completedAt: '2026-09-10T10:00:00',
  userSpeakingDurationMs: 52_000,
  messages,
  expressionGenerationStatus: 'READY',
  expressionLearningStatus: 'NOT_STARTED',
  expressions: [],
  correctionCount: messages.filter((message) => message.correction).length,
});

const renderTranscript = (
  messages: SmallTalkHistoryMessage[],
  { waitExpired = false } = {},
) => {
  sessionQuery.mockReturnValue({
    session: sessionOf(messages),
    error: null,
    isLoading: false,
    generationStuck: false,
    waitExpired,
    retry: vi.fn(),
    regenerate: vi.fn(),
  });
  render(<SmallTalkTranscript sessionId={7} />);
};

afterEach(cleanup);

describe('SmallTalkTranscript', () => {
  it('조회 중이면 텍스트 대신 스켈레톤이 뜬다', () => {
    // given
    sessionQuery.mockReturnValue({
      session: null,
      error: null,
      isLoading: true,
      generationStuck: false,
      waitExpired: false,
      retry: vi.fn(),
      regenerate: vi.fn(),
    });

    // when
    render(<SmallTalkTranscript sessionId={362} />);

    // then
    expect(
      screen.getByRole('status', { name: '대화를 불러오는 중' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('대화를 불러오는 중이에요')).toBeNull();
  });
});

describe('SmallTalkTranscript 교정 카드', () => {
  it('교정이 있으면 말풍선 아래에 더 자연스러운 문장과 이유가 보인다', () => {
    renderTranscript([
      messageOf({
        correctionStatus: 'COMPLETED',
        correction: {
          originalSentence: "I'm working out now.",
          betterSentence: "I'm at the gym right now.",
          reason: 'at the gym이 더 자연스러워요.',
          mistakePattern: 'VOCAB_CHOICE',
          memoryTag: null,
        },
      }),
    ]);

    expect(screen.getByText("I'm at the gym right now.")).toBeInTheDocument();
    expect(
      screen.getByText('at the gym이 더 자연스러워요.'),
    ).toBeInTheDocument();
    // 장기기억 근거가 없으면 날짜 태그도 없다
    expect(screen.queryByText(/스몰톡에서 말한/)).not.toBeInTheDocument();
  });

  it('장기기억 근거가 있으면 카드 안에 날짜 태그가 보인다', () => {
    renderTranscript([
      messageOf({
        correctionStatus: 'COMPLETED',
        correction: {
          originalSentence: 'I am doing stairs at a gym.',
          betterSentence: "Today it's just stairs at the gym.",
          reason: '둘 다 아는 곳엔 the를 붙여요.',
          mistakePattern: 'ARTICLE',
          memoryTag: '9/13 스몰톡에서 말한 헬스장',
        },
      }),
    ]);

    expect(
      screen.getByText(/9\/13 스몰톡에서 말한 헬스장/),
    ).toBeInTheDocument();
  });

  it.each([
    ['교정이 없으면', 'COMPLETED' as const],
    ['교정에 실패했으면', 'FAILED' as const],
  ])('%s 말풍선 아래에 아무것도 붙지 않는다', (_, correctionStatus) => {
    renderTranscript([messageOf({ correctionStatus, correction: null })]);

    expect(
      screen.queryByText('이렇게 말하면 더 자연스러워요', { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/찾는 중/)).not.toBeInTheDocument();
  });

  it('교정을 아직 만드는 중이면 말풍선 아래에 기다리는 표시가 보인다', () => {
    renderTranscript([
      messageOf({ correctionStatus: 'PREPARING', correction: null }),
    ]);

    expect(screen.getByText(/찾는 중/)).toBeInTheDocument();
  });

  it('상한까지 기다려 더는 묻지 않으면 찾는 중 표시를 거둔다', () => {
    renderTranscript(
      [messageOf({ correctionStatus: 'PREPARING', correction: null })],
      { waitExpired: true },
    );

    expect(screen.queryByText(/찾는 중/)).not.toBeInTheDocument();
  });
});

describe('SmallTalkTranscript 배운 표현 태그', () => {
  it('배운 표현을 썼으면 그 구절이 따로 강조되고 아래에 태그가 보인다', () => {
    renderTranscript([
      messageOf({
        correctionStatus: 'COMPLETED',
        correction: null,
        reusedExpression: {
          expressionId: 73,
          text: 'work out',
          matchedText: 'working out',
        },
      }),
    ]);

    expect(screen.getByText('working out')).toBeInTheDocument();
    expect(
      screen.getByText('배운 표현 「work out」을 썼어요', { exact: false }),
    ).toBeInTheDocument();
  });

  it('강조할 구절이 원문에 없으면 원문만 그대로 그린다', () => {
    renderTranscript([
      messageOf({
        correctionStatus: 'COMPLETED',
        correction: null,
        reusedExpression: {
          expressionId: 73,
          text: 'work out',
          matchedText: 'work out',
        },
      }),
    ]);

    expect(screen.getByText("I'm working out now.")).toBeInTheDocument();
    expect(screen.queryByText('work out')).not.toBeInTheDocument();
  });
});

describe('SmallTalkTranscript 상대 말풍선', () => {
  it('상대 메시지는 교정 필드가 없어도 원문과 번역을 그대로 그린다', () => {
    renderTranscript([
      messageOf({
        role: 'AI',
        content: 'What kind of workout are you doing today?',
        translatedContent: '오늘은 어떤 운동 하고 있어?',
      }),
    ]);

    expect(
      screen.getByText('What kind of workout are you doing today?'),
    ).toBeInTheDocument();
    expect(screen.getByText('오늘은 어떤 운동 하고 있어?')).toBeInTheDocument();
  });
});
