'use client';

// 복습 영작 스텝 — 작문 문제 여러 개를 큐로 돌린다. 틀리면 맨 뒤로 보내 맞출 때까지 다시 내고, 마지막 정답에서만 획득 연출로 완료한다
import { useState } from 'react';

import type { Partner } from '@/features/conversation/model/character-look';

import { settleReviewQueue, type QuizResult } from '../../model/review-queue';
import type { SentenceQuiz } from '../../model/sentence-quiz';
import { ReviewSuccess } from '../practice/ReviewSuccess';
import { QuizStep } from './QuizStep';

// 이만큼 틀리면 정답을 보여준다 — 1회 오답까지는 같은 문제 그대로, 2회부터는 정답을 보고 만든다
const REVEAL_AFTER_WRONGS = 2;

interface ReviewStepProps {
  // 풀 문제 목록 — 목록이 바뀌면(폴백→실제 문제 도착) 호출부가 key로 새로 세운다. 큐 인덱스가 이 목록에 묶여 있어서다
  quizzes: SentenceQuiz[];
  partner: Partner;
  expressionId: number;
  onBack: () => void;
  leftAction?: 'back' | 'close';
  // 진행바 시작점 — 여기서 1까지를 문제 수로 나눠 채운다
  progressStart: number;
  // 획득 연출에 보여줄 표현과 뜻
  expression: string;
  meaning: string;
  onFinish: () => void;
  finishing: boolean;
}

export const ReviewStep = ({
  quizzes,
  partner,
  expressionId,
  onBack,
  leftAction,
  progressStart,
  expression,
  meaning,
  onFinish,
  finishing,
}: ReviewStepProps) => {
  // 아직 안 풀린 문제 인덱스 — 맨 앞이 지금 문제
  const [pending, setPending] = useState(() =>
    quizzes.map((_, index) => index),
  );
  // 판정할 때마다 오른다 — 같은 문제가 다시 나와도 QuizStep을 새로 세우는 key
  const [round, setRound] = useState(0);
  // 문제별 틀린 횟수 — 재도전이면 라벨을 바꾸고, 두 번 틀리면 정답을 보여주며 낸다
  const [wrongCounts, setWrongCounts] = useState<Record<number, number>>({});

  const current = pending[0];
  const quiz = quizzes[current];
  // 마지막 문제(이걸 맞히면 큐가 빈다)에서만 획득 연출과 완료가 붙는다
  const last = pending.length === 1;
  const wrongCount = wrongCounts[current] ?? 0;
  // 틀리면 맨 뒤로 보내 맞출 때까지 다시 낸다(힌트를 봤든 아니든)
  const settle = (result: QuizResult) => {
    if (result === 'wrong') {
      setWrongCounts({ ...wrongCounts, [current]: wrongCount + 1 });
    }
    setPending(settleReviewQueue(pending, result));
    setRound((current) => current + 1);
  };
  // 재도전 라벨 — 두 번째 틀린 뒤엔 정답을 보여주고 그대로 만들게 한다
  const revealAnswer = wrongCount >= REVEAL_AFTER_WRONGS;
  const instruction =
    wrongCount === 0
      ? undefined
      : revealAnswer
        ? '정답을 보고 그대로 만들어보세요'
        : '다시 한번 해보세요';
  // 진행바는 푼 문제 수만큼 시작점에서 1까지 나눠 찬다
  const progressAt = (solved: number) =>
    progressStart + (1 - progressStart) * (solved / quizzes.length);
  const solved = quizzes.length - pending.length;

  return (
    <QuizStep
      step="review"
      // 판정마다 새 문제(또는 같은 문제의 재도전)로 상태를 통째로 리셋한다
      key={`${current}#${round}`}
      instruction={instruction}
      revealAnswer={revealAnswer}
      quiz={quiz}
      partner={partner}
      expressionId={expressionId}
      onBack={onBack}
      leftAction={leftAction}
      onNext={settle}
      nextLabel="다음 문제"
      wrongLabel={last ? '다시 풀어볼게요' : undefined}
      progressRange={[progressAt(solved), progressAt(solved + 1)]}
      correctSlot={
        last
          ? () => (
              <ReviewSuccess
                expression={expression}
                meaning={meaning}
                onFinish={onFinish}
                finishing={finishing}
              />
            )
          : undefined
      }
    />
  );
};
