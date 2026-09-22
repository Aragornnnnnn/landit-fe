// 대화 보기 — 조회 중엔 스켈레톤이 서고, 내 말풍선 아래엔 교정 카드와 배운 표현 태그가 조건에 따라 붙는다
import { EVENTS } from '@landit/analytics';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  SmallTalkHistoryMessage,
  SmallTalkSessionDetailResponse,
} from '@/features/small-talk/api/small-talk';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';

import { SmallTalkTranscript } from './SmallTalkTranscript';

const replace = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock('@/features/small-talk/model/useSmallTalkSessionQuery', () => ({
  useSmallTalkSessionQuery: vi.fn(),
}));
const track = vi.hoisted(() => vi.fn());
vi.mock('@/shared/analytics', () => ({ track }));

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
  { waitExpired = false, continueToLearning = false } = {},
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
  return render(
    <SmallTalkTranscript
      sessionId={7}
      continueToLearning={continueToLearning}
    />,
  );
};

// jsdom엔 scrollIntoView가 없다 — 어느 말풍선으로 갔는지만 본다
const scrollIntoView = vi.fn();
beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(cleanup);

const correctionOf = (betterSentence: string) => ({
  originalSentence: 'x',
  betterSentence,
  reason: '이유',
  mistakePattern: 'OTHER',
  memoryTag: null,
});

// 스크롤이 간 요소가 그 문장을 품고 있는가
const scrolledTo = (text: string) =>
  scrollIntoView.mock.contexts.some((element) =>
    (element as unknown as HTMLElement).textContent?.includes(text),
  );

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
    render(<SmallTalkTranscript sessionId={362} continueToLearning={false} />);

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
  ])('%s 말풍선 아래에 교정 카드가 붙지 않는다', (_, correctionStatus) => {
    renderTranscript([messageOf({ correctionStatus, correction: null })]);

    expect(
      screen.queryByText('이렇게 말하면 더 자연스러워요', { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/찾는 중/)).not.toBeInTheDocument();
  });

  it('고칠 게 없었으면 말풍선 아래에 잘했어요가 보인다', () => {
    // 아무것도 안 붙이면 잘 말한 것인지 아직 분석이 안 끝난 것인지 구분되지 않는다
    renderTranscript([
      messageOf({ correctionStatus: 'COMPLETED', correction: null }),
    ]);

    expect(screen.getByText('잘했어요!')).toBeInTheDocument();
  });

  it.each([
    ['교정에 실패했으면', 'FAILED' as const],
    ['아직 만드는 중이면', 'PREPARING' as const],
  ])('%s 잘했어요가 뜨지 않는다', (_, correctionStatus) => {
    // 교정이 null인 건 같지만 "고칠 게 없었다"는 뜻이 아니다
    renderTranscript([messageOf({ correctionStatus, correction: null })]);

    expect(screen.queryByText('잘했어요!')).not.toBeInTheDocument();
  });

  it('교정이 붙은 말풍선에는 잘했어요가 뜨지 않는다', () => {
    renderTranscript([
      messageOf({
        correctionStatus: 'COMPLETED',
        correction: correctionOf("I'm at the gym right now."),
      }),
    ]);

    expect(screen.queryByText('잘했어요!')).not.toBeInTheDocument();
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

describe('SmallTalkTranscript 교정 사이 이동', () => {
  const twoCorrections = () => [
    messageOf({
      messageId: 1,
      content: 'Hi.',
      correctionStatus: 'COMPLETED',
      correction: null,
    }),
    messageOf({
      messageId: 2,
      content: 'I go to gym.',
      correctionStatus: 'COMPLETED',
      correction: correctionOf('I went to the gym.'),
    }),
    messageOf({ messageId: 3, role: 'AI', content: 'Nice.' }),
    messageOf({
      messageId: 4,
      content: 'I am doing stairs at a gym.',
      correctionStatus: 'COMPLETED',
      correction: correctionOf("Today it's just stairs at the gym."),
    }),
  ];

  it('들어오면 첫 교정 메시지로 스크롤한다', () => {
    renderTranscript(twoCorrections());

    expect(scrolledTo('I went to the gym.')).toBe(true);
    expect(scrolledTo("Today it's just stairs at the gym.")).toBe(false);
  });

  it('남은 교정이 있으면 다음 자연스러운 말 칩이 보이고, 누르면 다음 교정으로 간다', async () => {
    renderTranscript(twoCorrections());

    await userEvent.click(
      screen.getByRole('button', { name: /다음 자연스러운 말/ }),
    );

    expect(scrolledTo("Today it's just stairs at the gym.")).toBe(true);
  });

  it('마지막 교정까지 가면 칩이 사라진다', async () => {
    renderTranscript(twoCorrections());

    await userEvent.click(
      screen.getByRole('button', { name: /다음 자연스러운 말/ }),
    );

    expect(
      screen.queryByRole('button', { name: /다음 자연스러운 말/ }),
    ).not.toBeInTheDocument();
  });

  it('교정이 하나뿐이면 첫 교정으로 간 뒤 칩이 없다', () => {
    renderTranscript(twoCorrections().slice(0, 3));

    expect(scrolledTo('I went to the gym.')).toBe(true);
    expect(
      screen.queryByRole('button', { name: /다음 자연스러운 말/ }),
    ).not.toBeInTheDocument();
  });

  it('교정이 뒤늦게 도착하면 읽던 자리를 뺏지 않고 칩으로만 알린다', () => {
    // 종료 흐름에서는 교정이 PREPARING으로 시작해 폴링으로 온다 —
    // 그때 화면을 끌면 위에서부터 읽고 있던 사람의 자리를 뺏는다
    const preparing = twoCorrections().map((message) =>
      message.role === 'USER'
        ? {
            ...message,
            correctionStatus: 'PREPARING' as const,
            correction: null,
          }
        : message,
    );
    const { rerender } = renderTranscript(preparing);
    expect(scrollIntoView).not.toHaveBeenCalled();

    sessionQuery.mockReturnValue({
      ...sessionQuery.mock.results[0]!.value,
      session: sessionOf(twoCorrections()),
    });
    rerender(<SmallTalkTranscript sessionId={7} continueToLearning={false} />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /다음 자연스러운 말/ }),
    ).toBeInTheDocument();
  });

  it('뒤늦게 온 교정도 칩을 누르면 첫 교정부터 데려간다', async () => {
    const preparing = twoCorrections().map((message) =>
      message.role === 'USER'
        ? {
            ...message,
            correctionStatus: 'PREPARING' as const,
            correction: null,
          }
        : message,
    );
    const { rerender } = renderTranscript(preparing);
    sessionQuery.mockReturnValue({
      ...sessionQuery.mock.results[0]!.value,
      session: sessionOf(twoCorrections()),
    });
    rerender(<SmallTalkTranscript sessionId={7} continueToLearning={false} />);

    await userEvent.click(
      screen.getByRole('button', { name: /다음 자연스러운 말/ }),
    );

    expect(scrolledTo('I went to the gym.')).toBe(true);
  });

  it('폴링으로 응답이 갱신돼도 첫 교정으로 다시 가지 않는다', () => {
    const { rerender } = renderTranscript(twoCorrections());

    // 서버가 같은 내용을 새 객체로 다시 준 상황
    sessionQuery.mockReturnValue({
      ...sessionQuery.mock.results[0]!.value,
      session: sessionOf(twoCorrections()),
    });
    rerender(<SmallTalkTranscript sessionId={7} continueToLearning={false} />);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('도착한 뒤 더 앞 메시지에 교정이 뒤늦게 생겨도 도착 자리를 지킨다', () => {
    // 4번 메시지 교정만 먼저 온 상태로 들어왔다
    const late = twoCorrections();
    const { rerender } = renderTranscript([
      late[0]!,
      { ...late[1]!, correction: null },
      late[2]!,
      late[3]!,
    ]);
    expect(scrolledTo("Today it's just stairs at the gym.")).toBe(true);

    // 폴링으로 2번 메시지 교정이 뒤늦게 왔다
    sessionQuery.mockReturnValue({
      ...sessionQuery.mock.results[0]!.value,
      session: sessionOf(late),
    });
    rerender(<SmallTalkTranscript sessionId={7} continueToLearning={false} />);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: /다음 자연스러운 말/ }),
    ).not.toBeInTheDocument();
  });

  it('교정이 없으면 스크롤도 칩도 없다', () => {
    renderTranscript([
      messageOf({ correctionStatus: 'COMPLETED', correction: null }),
    ]);

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /다음 자연스러운 말/ }),
    ).not.toBeInTheDocument();
  });
});

describe('SmallTalkTranscript 종료 흐름', () => {
  it('대화 종료 흐름에서 왔으면 표현 배우러 가기 버튼이 있고, 누르면 축하를 켠 표현 화면으로 간다', async () => {
    renderTranscript(
      [messageOf({ correctionStatus: 'COMPLETED', correction: null })],
      {
        continueToLearning: true,
      },
    );

    await userEvent.click(
      screen.getByRole('button', { name: /표현 배우러 가기/ }),
    );

    expect(replace).toHaveBeenCalledWith(
      '/expressions/session/7/branch?celebrate=1',
    );
  });

  it('기록에서 열었으면 표현 배우러 가기 버튼이 없다', () => {
    renderTranscript([
      messageOf({ correctionStatus: 'COMPLETED', correction: null }),
    ]);

    expect(
      screen.queryByRole('button', { name: /표현 배우러 가기/ }),
    ).not.toBeInTheDocument();
  });
});

describe('SmallTalkTranscript 계측', () => {
  it.each([
    ['종료 흐름에서 왔으면', true, 'summary'],
    ['기록에서 열었으면', false, 'history'],
  ])(
    '%s 그 길과 교정 개수를 노출에 남긴다',
    (_, continueToLearning, source) => {
      renderTranscript(
        [
          messageOf({
            correctionStatus: 'COMPLETED',
            correction: correctionOf('Better.'),
          }),
        ],
        { continueToLearning },
      );

      expect(track).toHaveBeenCalledWith(EVENTS.SMALL_TALK_FEEDBACK_VIEWED, {
        session_id: 7,
        source,
        correction_count: 1,
      });
    },
  );
});
