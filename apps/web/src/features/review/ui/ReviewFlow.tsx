'use client';

// 푸시 복습 플로우 — 알림으로 들어와 시작 안내 → 문제 → 완료. 큐 순서·채점·완료 판정은 모두 서버 상태를 따른다.
// 학습 안의 복습(ReviewStep)과 화면은 같지만, 그쪽은 문제 큐를 브라우저가 들고 여기선 서버가 든다
import { useEffect, useRef, useState } from 'react';
import { EVENTS, type ExpressionReviewStep } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// 가로 import 사유: 복습이 푸는 문제는 표현학습의 단어 칩 퀴즈 그대로다 — 화면·문제 변환·재도전 규칙의 정본이 expression에 있다
import { pickDistinctPartners } from '@/features/expression/model/quiz-partner';
import { retryGuideOf } from '@/features/expression/model/review-queue';
import { fromWritingSentence } from '@/features/expression/model/sentence-quiz';
import { QuizStep } from '@/features/expression/ui/learning/QuizStep';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import { preloadImages } from '@/shared/lib/preload-next-images';
import { SCENARIO_PATH } from '@/shared/lib/routes';

import type { Review } from '../api/review';
import { reviewKeys } from '../model/keys';
import {
  currentQuestionOf,
  isFinished,
  isSolved,
  MAX_ATTEMPTS,
  pendingQuestionsOf,
  progressRangeOf,
} from '../model/review-progress';
import { useReviewAnswerMutation } from '../model/useReviewAnswerMutation';
import { isRetriableFailure, useReviewQuery } from '../model/useReviewQuery';
import { useStartReviewMutation } from '../model/useStartReviewMutation';
import { ReviewComplete } from './ReviewComplete';
import { LANDY_QUIZ, ReviewIntro } from './ReviewIntro';
import { ReviewNotice } from './ReviewNotice';

// 오답 시트의 CTA — 같은 문제를 다시 만나는 경우에만 "다시 풀어볼게요"다.
// 기회가 끝났으면(lastAttempt) 이 문제는 놓친 것으로 넘어가므로 남은 문제 유무로 갈린다
const wrongLabelOf = (last: boolean, lastAttempt: boolean) => {
  if (!last) return '다음 문제';
  return lastAttempt ? '결과 볼게요' : '다시 풀어볼게요';
};

export const ReviewFlow = ({ reviewId }: { reviewId: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    review: fetched,
    error,
    isLoading,
    refetch,
  } = useReviewQuery(reviewId);
  // 서버가 준 최신 상태 — 결과 시트를 넘길 때 반영한다. 채점 직후 바로 갈아치우면 시트가 뜬 채로 문제가 바뀐다
  const [applied, setApplied] = useState<Review | null>(null);
  // 판정을 받아 둔 다음 상태 — 시트의 CTA에서 applied로 옮긴다
  const graded = useRef<Review | null>(null);
  // 틀려서 같은 문제가 다시 나와도 퀴즈를 새로 세우는 key
  const [round, setRound] = useState(0);
  // 문제마다 다른 얼굴이 묻는다 — 문제 수와 무관하게 세 명을 뽑아 두고 출제 순서로 고른다(같은 문제는 같은 얼굴)
  const [partners] = useState(() => pickDistinctPartners(3));
  // 결과 화면에 도달한 순간 — 서버가 완료로 바꿨든, 문제마다 두 번씩 풀어 결판이 났든 같은 끝점이다
  const finishedNow = applied !== null && isFinished(applied);

  useEffect(() => {
    if (!applied || !finishedNow) return;

    const solved = applied.questions.filter(isSolved).length;
    track(EVENTS.EXPRESSION_REVIEW_FINISHED, {
      question_count: applied.questions.length,
      solved_count: solved,
      perfect: solved === applied.questions.length,
    });
    // 끝나는 건 한 번뿐이라 도달 시점에만 찍는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishedNow]);

  const start = useStartReviewMutation(reviewId);
  const answer = useReviewAnswerMutation(reviewId);

  // 복습은 기록을 남기지 않는다 — 나가면 홈으로. replace로 히스토리에서 지워 뒤로가기로 되돌아오지 않게 한다
  const goHome = () => router.replace(SCENARIO_PATH);

  // 계측 분모 — 서버가 문제를 고정해 주므로 문제 수와 맞힌 수로 어디까지 갔는지 본다
  const countsOf = (state: Review | null) => ({
    question_count: state?.questions.length ?? 0,
    solved_count: state?.questions.filter(isSolved).length ?? 0,
  });

  // 결과를 보기 전에 나간 경우 — 어느 자리에서 닫았는지 남기고 홈으로
  const abandon = (step: ExpressionReviewStep) => {
    track(EVENTS.EXPRESSION_REVIEW_ABANDONED, {
      step,
      ...countsOf(applied ?? fetched),
    });
    goHome();
  };

  // 시작 안내의 그림은 조회를 기다리지 않고 나란히 받는다 — preload는 멱등이라 렌더 중 호출도 안전하다
  preloadImages([LANDY_QUIZ]);

  const review = applied ?? fetched;
  if (!review) {
    if (isLoading) return <ReviewLoading />;
    return (
      <ReviewNotice
        message={error?.message ?? '복습을 불러오지 못했어요.'}
        onHome={goHome}
        onRetry={
          error && isRetriableFailure(error) ? () => void refetch() : undefined
        }
      />
    );
  }

  if (review.status === 'READY') {
    return (
      <ReviewIntro
        starting={start.isPending}
        onStart={() =>
          start.mutate(undefined, {
            onSuccess: (started) => {
              track(EVENTS.EXPRESSION_REVIEW_STARTED, {
                question_count: started.questions.length,
              });
              setApplied(started);
            },
          })
        }
        onClose={() => abandon('intro')}
      />
    );
  }

  // 서버는 전부 맞혀야 완료로 보지만, 우리는 문제마다 두 번까지만 낸다 — 두 번 틀린 문제는 놓친 것으로 두고 끝낸다.
  // 기한이 지난 상태라도 이번에 푼 결과가 손에 있으면 안내 문구로 덮지 않는다
  if (isFinished(review) && (review.status !== 'EXPIRED' || applied !== null)) {
    return (
      <ReviewComplete
        questions={review.questions}
        // applied는 이 화면에서 받은 응답만 담는다 — 있으면 방금 끝낸 것이다
        justFinished={applied !== null}
        onHome={goHome}
      />
    );
  }

  const question = currentQuestionOf(review);
  // 서버가 이미 놓친 문제를 가리키는 경우는 남은 문제가 없을 때뿐이라 위에서 걸러진다
  if (review.status === 'EXPIRED' || !question) {
    return (
      <ReviewNotice
        message="복습할 수 있는 기간이 지났어요. 다음 알림에서 다시 만나요."
        onHome={goHome}
      />
    );
  }

  // 판정은 서버가 한다 — 한국어 문제는 복수 정답이라 단어 순서만으로는 맞는지 알 수 없다
  const askServer = async (words: string[]) => {
    try {
      const result = await answer.mutateAsync({
        questionId: question.questionId,
        words,
      });
      graded.current = result.review;
      return result.correct ? ('correct' as const) : ('wrong' as const);
    } catch (thrown) {
      // 기한이 지났으면 더 풀 수 없다 — 안내 화면으로 넘긴다 (GET도 같은 상태를 준다)
      if (thrown instanceof ApiError && thrown.code === 'REVIEW_EXPIRED') {
        setApplied({ ...review, status: 'EXPIRED', currentQuestionId: null });
      }
      // 409는 화면이 쥔 현재 문제가 서버와 어긋났다는 뜻이다 — 다시 눌러도 같은 답이라
      // 서버 상태를 새로 받아 맞춘다. 그냥 두면 나가는 것 말고 빠져나갈 길이 없다
      if (thrown instanceof ApiError && thrown.status === 409) {
        const { data: latest } = await refetch();
        if (latest) setApplied(latest);
      }
      // 다시 던져 QuizStep이 결과 시트 없이 재시도를 받게 한다 (실패 안내는 뮤테이션이 띄운다)
      throw thrown;
    }
  };

  // 기회가 남은 마지막 문제인가 — 이걸 결판내면 결과 화면으로 넘어간다
  const last = pendingQuestionsOf(review).length === 1;
  // 이번에 틀리면 이 문제는 놓친 것으로 끝난다 — 오답 CTA가 "다시 풀어볼게요"인지 여기서 갈린다
  const lastAttempt = question.wrongCount + 1 >= MAX_ATTEMPTS;
  // 재도전 지시문은 학습 안의 복습과 같은 문구를 쓴다. 정답 공개는 여기선 하지 않는다 —
  // 기회가 두 번뿐이라 답을 보여주면 남은 한 번이 베껴 쓰기가 된다 (학습 안의 복습은 세 번째부터 공개한다)
  const { instruction } = retryGuideOf(question.wrongCount);

  return (
    <QuizStep
      step="expression_review"
      // 다음 문제(또는 같은 문제의 재도전)마다 고른 칩·판정을 통째로 리셋한다
      key={`${question.questionId}#${round}`}
      quiz={fromWritingSentence(question.quiz)}
      partner={partners[question.displayOrder % partners.length]}
      expressionId={question.expressionId}
      leftAction="close"
      onBack={() => abandon('quiz')}
      instruction={instruction}
      revealAnswer={false}
      judge={askServer}
      // 틀린 문제는 곧 다시 나온다 — 시트에서 정답을 알려주면 재도전이 무의미하다
      hideWrongAnswer
      onNext={() => {
        if (graded.current) {
          setApplied(graded.current);
          // 캐시도 같이 옮긴다 — 시트가 뜬 동안은 미루지만, 넘어간 뒤엔 다시 들어와도 같은 자리에서 이어야 한다
          queryClient.setQueryData(reviewKeys.detail(reviewId), graded.current);
        }
        graded.current = null;
        setRound((current) => current + 1);
      }}
      nextLabel={last ? '결과 볼게요' : '다음 문제'}
      wrongLabel={wrongLabelOf(last, lastAttempt)}
      progressRange={progressRangeOf(review)}
    />
  );
};

// 첫 조회 동안 — 진행바만 있는 빈 화면으로 다음 화면의 자리를 잡아 둔다
const ReviewLoading = () => (
  <div
    className="mx-auto h-dvh max-w-[430px] bg-background"
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    <div className="h-1 w-full bg-secondary" />
  </div>
);
