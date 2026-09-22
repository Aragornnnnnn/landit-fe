// 푸시 복습 플로우 — 상태별 화면 분기, 서버 판정을 받은 뒤 다음 문제로 넘어가는 진행, 완료·만료 처리
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';

import type { Review, ReviewQuestion } from '../api/review';
import { useReviewAnswerMutation } from '../model/useReviewAnswerMutation';
import { useReviewQuery } from '../model/useReviewQuery';
import { useStartReviewMutation } from '../model/useStartReviewMutation';
import { ReviewFlow } from './ReviewFlow';

const replace = vi.fn();
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다.
// 시작 화면 그림을 미리 받는 preloadImages가 getImageProps를 쓰므로 같이 세운다
vi.mock('next/image', () => ({
  default: () => <span />,
  getImageProps: ({ src }: { src: string }) => ({ props: { src } }),
}));
// jsdom엔 캔버스가 없어 콘페티가 프레임에서 터진다
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
// 조회만 목한다 — 재시도 판정은 실물을 그대로 쓴다(화면과 쿼리가 같은 술어를 본다는 게 계약이다)
vi.mock('../model/useReviewQuery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useReviewQuery')>()),
  useReviewQuery: vi.fn(),
}));
vi.mock('../model/useStartReviewMutation', () => ({
  useStartReviewMutation: vi.fn(),
}));
vi.mock('../model/useReviewAnswerMutation', () => ({
  useReviewAnswerMutation: vi.fn(),
}));
// 칩 퀴즈 UI는 이 테스트의 관심사가 아니다 — 지금 문제·CTA 문구·진행 구간을 드러내고
// 제출(서버 판정 요청)과 시트 넘기기만 버튼으로 노출한다
vi.mock('@/features/expression/ui/learning/QuizStep', () => ({
  QuizStep: ({
    quiz,
    judge,
    onNext,
    onBack,
    nextLabel,
    progressRange,
  }: {
    quiz: { answerText: string };
    judge?: (words: string[]) => Promise<'correct' | 'wrong'>;
    onNext: (result: 'correct' | 'wrong') => void;
    onBack: () => void;
    nextLabel?: string;
    progressRange?: [number, number];
  }) => (
    <div>
      <button onClick={onBack}>나가기</button>
      <p>question:{quiz.answerText}</p>
      <p>label:{nextLabel}</p>
      <p>progress:{progressRange?.join('~')}</p>
      {/* QuizStep과 같이 판정 실패는 삼킨다 — 화면은 그대로 두고 다시 누를 수 있다 */}
      <button onClick={() => void judge?.(['I', 'win']).catch(() => {})}>
        제출
      </button>
      <button onClick={() => onNext('correct')}>넘기기</button>
    </div>
  ),
}));

afterEach(cleanup);

// 플로우가 진행 상태를 캐시에도 써 넣는다 — 테스트마다 빈 클라이언트를 준다
const show = (reviewId = 'r1') =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReviewFlow reviewId={reviewId} />
    </QueryClientProvider>,
  );

const question = (
  questionId: string,
  text: string,
  completedAt: string | null = null,
  wrongCount = 0,
): ReviewQuestion => ({
  questionId,
  expressionId: Number(questionId.slice(1)),
  targetExpressionText: `표현 ${questionId}`,
  baseExpressionMeaningText: `뜻 ${questionId}`,
  quiz: {
    quizLanguage: 'EN',
    writingSentenceText: text,
    writingSentenceTranslation: `${text} 해석`,
    writingQuestion: 'How was it?',
    writingQuestionTranslation: '어땠어?',
    writingSentenceWords: text.split(' '),
    writingSentenceWordChoices: text.split(' '),
  },
  displayOrder: 0,
  queueOrder: 0,
  wrongCount,
  completedAt,
});

const review = (patch: Partial<Review>): Review => ({
  reviewId: 'r1',
  status: 'IN_PROGRESS',
  availableUntil: '2026-09-29T00:00',
  expiresAt: '2026-09-23T00:00',
  completedAt: null,
  currentQuestionId: 'q1',
  questions: [question('q1', 'I win'), question('q2', 'You win')],
  ...patch,
});

// 훅 목 배선 — 조회 결과, 시작 응답, 제출 응답을 테스트마다 정해 준다
const wire = ({
  fetched,
  error,
  started,
  answered,
}: {
  fetched?: Review | null;
  error?: Error;
  started?: Review;
  answered?: () => Promise<{ correct: boolean; review: Review }>;
}) => {
  vi.mocked(useReviewQuery).mockReturnValue({
    review: fetched ?? null,
    error,
    isLoading: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useReviewQuery>);
  vi.mocked(useStartReviewMutation).mockReturnValue({
    isPending: false,
    mutate: (_: undefined, options?: { onSuccess: (review: Review) => void }) =>
      started && options?.onSuccess(started),
  } as unknown as ReturnType<typeof useStartReviewMutation>);
  vi.mocked(useReviewAnswerMutation).mockReturnValue({
    mutateAsync: answered ?? vi.fn(),
  } as unknown as ReturnType<typeof useReviewAnswerMutation>);
};

describe('ReviewFlow', () => {
  it('시작 전이면 안내를 보여주고, 시작하면 서버가 준 첫 문제를 낸다', async () => {
    const user = userEvent.setup();
    wire({
      fetched: review({
        status: 'READY',
        currentQuestionId: null,
        questions: [],
      }),
      started: review({}),
    });
    show();

    await user.click(screen.getByRole('button', { name: '복습 시작할게요' }));

    expect(screen.getByText('question:I win')).toBeInTheDocument();
  });

  it('서버가 오답이라고 해도 시트를 넘기면 서버가 가리킨 다음 문제로 간다', async () => {
    const user = userEvent.setup();
    // given — 틀려서 q1이 큐 뒤로 가고 q2가 현재 문제가 된 상태를 서버가 돌려준다
    wire({
      fetched: review({}),
      answered: () =>
        Promise.resolve({
          correct: false,
          review: review({
            currentQuestionId: 'q2',
            questions: [
              question('q1', 'I win', null, 1),
              question('q2', 'You win'),
            ],
          }),
        }),
    });
    show();

    await user.click(screen.getByRole('button', { name: '제출' }));
    await user.click(screen.getByRole('button', { name: '넘기기' }));

    expect(screen.getByText('question:You win')).toBeInTheDocument();
  });

  it('결판난 문제 수만큼 진행 구간이 앞으로 간다', () => {
    wire({
      fetched: review({
        currentQuestionId: 'q2',
        questions: [
          question('q1', 'I win', '2026-09-22T10:00'),
          question('q2', 'You win'),
        ],
      }),
    });
    show();

    expect(screen.getByText('progress:0.5~1')).toBeInTheDocument();
  });

  it('마지막 문제를 맞히고 넘기면 복습한 표현과 함께 결과 화면을 보여준다', async () => {
    const user = userEvent.setup();
    wire({
      fetched: review({
        currentQuestionId: 'q2',
        questions: [
          question('q1', 'I win', '2026-09-22T10:00'),
          question('q2', 'You win'),
        ],
      }),
      answered: () =>
        Promise.resolve({
          correct: true,
          review: review({
            status: 'COMPLETED',
            currentQuestionId: null,
            completedAt: '2026-09-22T10:05',
            questions: [
              question('q1', 'I win', '2026-09-22T10:00'),
              question('q2', 'You win', '2026-09-22T10:05'),
            ],
          }),
        }),
    });
    show();

    await user.click(screen.getByRole('button', { name: '제출' }));
    await user.click(screen.getByRole('button', { name: '넘기기' }));

    expect(screen.getByText('복습 완료!')).toBeInTheDocument();
    expect(screen.getByText('표현 q1')).toBeInTheDocument();
    expect(screen.getByText('표현 q2')).toBeInTheDocument();
  });

  it('기회가 남은 문제가 하나뿐이면 CTA가 결과로 넘기는 문구가 된다', () => {
    wire({
      fetched: review({
        currentQuestionId: 'q2',
        questions: [
          question('q1', 'I win', '2026-09-22T10:00'),
          question('q2', 'You win'),
        ],
      }),
    });
    show();

    expect(screen.getByText('label:결과 볼게요')).toBeInTheDocument();
  });

  it('두 번 틀린 문제는 더 내지 않고 놓친 표현으로 결과 화면에 남는다', async () => {
    const user = userEvent.setup();
    // given — 한 번 틀린 마지막 문제. 여기서 또 틀리면 기회가 끝난다
    wire({
      fetched: review({
        currentQuestionId: 'q2',
        questions: [
          question('q1', 'I win', '2026-09-22T10:00'),
          question('q2', 'You win', null, 1),
        ],
      }),
      answered: () =>
        Promise.resolve({
          correct: false,
          review: review({
            currentQuestionId: 'q2',
            questions: [
              question('q1', 'I win', '2026-09-22T10:00'),
              question('q2', 'You win', null, 2),
            ],
          }),
        }),
    });
    show();

    await user.click(screen.getByRole('button', { name: '제출' }));
    await user.click(screen.getByRole('button', { name: '넘기기' }));

    expect(screen.getByText('복습 완료!')).toBeInTheDocument();
    expect(
      screen.getByText('놓친 표현은 다음에 다시 만나요.'),
    ).toBeInTheDocument();
  });

  it('시작하면 문제 수와 함께 시작을 남긴다', async () => {
    const user = userEvent.setup();
    wire({
      fetched: review({
        status: 'READY',
        currentQuestionId: null,
        questions: [],
      }),
      started: review({}),
    });
    show();

    await user.click(screen.getByRole('button', { name: '복습 시작할게요' }));

    expect(track).toHaveBeenCalledWith('Expression Review Started', {
      question_count: 2,
    });
  });

  it('결과에 도달하면 맞힌 수와 만점 여부를 남긴다', async () => {
    const user = userEvent.setup();
    wire({
      fetched: review({
        currentQuestionId: 'q2',
        questions: [
          question('q1', 'I win', '2026-09-22T10:00'),
          question('q2', 'You win'),
        ],
      }),
      answered: () =>
        Promise.resolve({
          correct: true,
          review: review({
            status: 'COMPLETED',
            currentQuestionId: null,
            questions: [
              question('q1', 'I win', '2026-09-22T10:00'),
              question('q2', 'You win', '2026-09-22T10:05'),
            ],
          }),
        }),
    });
    show();

    await user.click(screen.getByRole('button', { name: '제출' }));
    await user.click(screen.getByRole('button', { name: '넘기기' }));

    expect(track).toHaveBeenCalledWith('Expression Review Finished', {
      question_count: 2,
      solved_count: 2,
      perfect: true,
    });
  });

  it('문제를 풀다 나가면 어느 자리에서 나갔는지 남긴다', async () => {
    const user = userEvent.setup();
    wire({ fetched: review({}) });
    show();

    await user.click(screen.getByRole('button', { name: '나가기' }));

    expect(track).toHaveBeenCalledWith('Expression Review Abandoned', {
      step: 'quiz',
      question_count: 2,
      solved_count: 0,
    });
  });

  it('제출이 기한 만료로 거절되면 안내 화면으로 넘어간다', async () => {
    const user = userEvent.setup();
    wire({
      fetched: review({}),
      answered: () =>
        Promise.reject(
          new ApiError(
            '복습 유효기간이 지났습니다.',
            410,
            '/api/v1/reviews/r1/answers',
            'REVIEW_EXPIRED',
          ),
        ),
    });
    show();

    await user.click(screen.getByRole('button', { name: '제출' }));

    expect(
      screen.getByText(/복습할 수 있는 기간이 지났어요/),
    ).toBeInTheDocument();
  });

  it('제출이 순서 어긋남(409)으로 거절되면 서버 상태를 다시 받아 화면을 맞춘다', async () => {
    const user = userEvent.setup();
    // given — 서버는 이미 q2를 내고 있는데 화면은 q1을 쥐고 있다
    const refetch = vi.fn().mockResolvedValue({
      data: review({
        currentQuestionId: 'q2',
        questions: [
          question('q1', 'I win', '2026-09-22T10:00'),
          question('q2', 'You win'),
        ],
      }),
    });
    vi.mocked(useReviewQuery).mockReturnValue({
      review: review({}),
      error: undefined,
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useReviewQuery>);
    vi.mocked(useStartReviewMutation).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useStartReviewMutation>);
    vi.mocked(useReviewAnswerMutation).mockReturnValue({
      mutateAsync: () =>
        Promise.reject(
          new ApiError(
            '복습을 먼저 시작해 주세요.',
            409,
            '/api/v1/reviews/r1/answers',
            'REVIEW_NOT_STARTED',
          ),
        ),
    } as unknown as ReturnType<typeof useReviewAnswerMutation>);
    show();

    await user.click(screen.getByRole('button', { name: '제출' }));

    expect(screen.getByText('question:You win')).toBeInTheDocument();
  });

  it('기한이 지난 복습으로 들어오면 안내와 홈 버튼만 보여준다', () => {
    wire({
      fetched: review({
        status: 'EXPIRED',
        currentQuestionId: null,
        questions: [],
      }),
    });
    show();

    expect(
      screen.getByText(/복습할 수 있는 기간이 지났어요/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '홈으로 갈게요' }),
    ).toBeInTheDocument();
  });

  it('없는 복습(404)이면 다시 시도를 주지 않고 서버 문구를 보여준다', () => {
    wire({
      fetched: null,
      error: new ApiError(
        '복습을 찾을 수 없습니다.',
        404,
        '/api/v1/reviews/r1',
        'NOT_FOUND',
      ),
    });
    show();

    expect(screen.getByText('복습을 찾을 수 없습니다.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '다시 시도' }),
    ).not.toBeInTheDocument();
  });

  it('서버 오류로 못 불러왔으면 다시 시도할 수 있다', () => {
    wire({
      fetched: null,
      error: new ApiError(
        '서버 오류가 발생했어요. (500)',
        500,
        '/api/v1/reviews/r1',
      ),
    });
    show();

    expect(
      screen.getByRole('button', { name: '다시 시도' }),
    ).toBeInTheDocument();
  });
});
