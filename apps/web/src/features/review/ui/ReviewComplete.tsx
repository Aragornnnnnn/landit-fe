'use client';

// 복습 결과 — 표현 카드가 하나씩 칠해진다(맞힘 초록·놓침 회색). 전부 맞히면 마지막 칠 뒤에 폭죽.
// 기록은 남기지 않고 홈으로 돌려보낸다 (복습은 알림으로만 들어오는 별도 흐름)
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, useReducedMotion } from 'motion/react';

import { EASE_STANDARD } from '@/shared/motion';
import { Button } from '@/shared/ui/Button';
import { CheckIcon, CloseIcon } from '@/shared/ui/Icons';

import type { ReviewQuestion } from '../api/review';
import { isSolved } from '../model/review-progress';

interface ReviewCompleteProps {
  questions: ReviewQuestion[];
  // 이번에 막 끝냈는가 — 끝난 복습을 알림으로 다시 열어 본 경우엔 연출 없이 결과만 보여준다
  justFinished: boolean;
  onHome: () => void;
}

// 카드가 하나씩 칠해지는 간격과, 한 장이 다 칠해지는 데 걸리는 시간(초)
const PAINT_DELAY = 0.18;
const PAINT_DURATION = 0.45;

// 맞힌 개수는 아래 카드 색이 이미 보여준다 — 부제는 세지 않고 다음 말만 건넨다
const subtitleOf = (solved: number, total: number) => {
  if (solved === total) return '전부 맞혔어요. 대화에서 적극 활용해 보세요.';
  if (solved === 0) return '괜찮아요. 놓친 표현은 다음에 다시 만나요.';
  return '놓친 표현은 다음에 다시 만나요.';
};

export const ReviewComplete = ({
  questions,
  justFinished,
  onHome,
}: ReviewCompleteProps) => {
  const reduced = useReducedMotion() ?? false;
  const solved = questions.filter(isSolved).length;
  const perfect = solved === questions.length;
  // 폭죽은 마지막 카드까지 칠해진 뒤에 터진다 — 먼저 터지면 결과를 읽기 전에 시선을 빼앗는다
  const paintedMs =
    ((questions.length - 1) * PAINT_DELAY + PAINT_DURATION) * 1000;

  useEffect(() => {
    if (!justFinished || !perfect) return;

    const timer = setTimeout(() => {
      const base = {
        spread: 70,
        startVelocity: 45,
        ticks: 150,
        colors: ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'],
        disableForReducedMotion: true,
      };
      confetti({
        ...base,
        particleCount: 55,
        angle: 60,
        origin: { x: 0, y: 0.9 },
      });
      confetti({
        ...base,
        particleCount: 55,
        angle: 120,
        origin: { x: 1, y: 0.9 },
      });
    }, paintedMs);

    return () => clearTimeout(timer);
  }, [justFinished, perfect, paintedMs]);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background px-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }}
    >
      <h1 className="text-[26px] font-black text-foreground">복습 완료!</h1>
      <p className="mt-2 text-sm leading-relaxed font-medium break-keep text-muted-foreground">
        {subtitleOf(solved, questions.length)}
      </p>

      <ul className="mt-8 flex flex-col gap-3 overflow-y-auto">
        {questions.map((question, index) => {
          const correct = isSolved(question);
          return (
            <li
              key={question.questionId}
              className="relative overflow-hidden rounded-2xl bg-card"
            >
              {/* 칠 — 왼쪽에서 오른쪽으로 카드 전체가 색으로 덮인다 */}
              <motion.span
                aria-hidden
                className={`absolute inset-0 origin-left ${
                  correct ? 'bg-success/12' : 'bg-secondary'
                }`}
                initial={justFinished && !reduced ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: PAINT_DURATION,
                  ease: EASE_STANDARD,
                  delay: index * PAINT_DELAY,
                }}
              />

              <div className="relative flex items-center gap-4 px-5 py-4">
                <span className="flex min-w-0 flex-col">
                  <span
                    className={`truncate text-[17px] font-extrabold ${
                      correct ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {question.targetExpressionText}
                  </span>
                  <span className="mt-0.5 truncate text-[13px] font-semibold text-muted-foreground">
                    {question.baseExpressionMeaningText}
                  </span>
                </span>
                {/* 색만으로 갈리지 않게 표시를 남긴다 — 칠이 주인공이라 테두리 없이 작게 */}
                <span
                  className={`ml-auto shrink-0 ${
                    correct ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {correct ? (
                    <CheckIcon size={22} strokeWidth={3} />
                  ) : (
                    <CloseIcon size={22} strokeWidth={3} />
                  )}
                </span>
                <span className="sr-only">{correct ? '맞힘' : '놓침'}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />
      <div className="pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Button variant={perfect ? 'success' : 'primary'} onClick={onHome}>
          홈으로 갈게요
        </Button>
      </div>
    </main>
  );
};
