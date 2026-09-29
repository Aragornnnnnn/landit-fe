'use client';

// 복습 결과 — 래디가 결과를 알리고 표현 카드가 하나씩 칠해진다(맞힘 초록·놓침 빨강). 전부 맞히면 마지막 칠 뒤에 폭죽.
// 기록은 남기지 않고 홈으로 돌려보낸다 (복습은 알림으로만 들어오는 별도 흐름)
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import type { PreloadableImage } from '@/shared/lib/preload-next-images';
import { EASE_STANDARD } from '@/shared/motion';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';
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

/** 결과 그림 — 문제를 푸는 동안 미리 받아 두려고 밖에서도 같은 주소를 쓴다 */
export const LANDY_REVIEW_PERFECT: PreloadableImage = {
  src: '/images/character/landy-review-perfect.webp',
  width: 230,
  height: 230,
};
export const LANDY_REVIEW_STUDY: PreloadableImage = {
  src: '/images/character/landy-review-study.webp',
  width: 230,
  height: 230,
};

// 결과 한 컷(제목·이모지·부제·그림)을 한 곳에서 고른다 — 몇 개 맞혔는지는 아래 카드가 보여 준다
const resultOf = (perfect: boolean, solved: number) => {
  if (perfect)
    return {
      title: '완벽해요!',
      emoji: '🎉',
      subtitle: '전부 맞혔어요. 대화에서 적극 활용해 보세요.',
      image: LANDY_REVIEW_PERFECT,
    };
  const missed = {
    subtitle: '틀린 표현은 다음 복습에서 마스터해봐요.',
    image: LANDY_REVIEW_STUDY,
  };
  if (solved === 0) return { title: '괜찮아요!', emoji: '💪', ...missed };
  return { title: '잘했어요!', emoji: '👏', ...missed };
};

export const ReviewComplete = ({
  questions,
  justFinished,
  onHome,
}: ReviewCompleteProps) => {
  const reduced = useReducedMotion() ?? false;
  // 끝난 문제 전부가 맞힘일 때만 만점이다 — 두 번 틀려 끝난 문제는 맞힘이 아니다
  const solved = questions.filter(isSolved).length;
  const perfect = solved === questions.length;
  const result = resultOf(perfect, solved);
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
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <motion.div
        className="mx-auto"
        initial={justFinished && !reduced ? { scale: 0.6, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
      >
        {/* 작은 폰에서도 카드가 밀려나지 않게 화면 높이에 맞춰 줄어든다 */}
        <Image
          {...result.image}
          alt=""
          priority
          className="h-[min(230px,30dvh)] w-auto"
        />
      </motion.div>

      <h1 className="mt-1 text-center text-[30px] font-black text-foreground">
        {result.title}
        <Emoji className="ml-1.5 align-[-0.1em]">{result.emoji}</Emoji>
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed font-medium break-keep text-muted-foreground">
        {result.subtitle}
      </p>

      {/* 스크롤 영역이 카드 그림자를 자르지 않게 안쪽 여백을 둔다 */}
      <ul className="-mx-2 mt-5 flex flex-col gap-2 overflow-y-auto px-2 pt-2 pb-4">
        {questions.map((question, index) => {
          const correct = isSolved(question);
          return (
            <li
              key={question.questionId}
              className="relative overflow-hidden rounded-[22px] bg-card"
            >
              {/* 칠 — 왼쪽에서 오른쪽으로 카드 전체가 색으로 덮인다 */}
              <motion.span
                aria-hidden
                className={`absolute inset-0 origin-left ${
                  correct ? 'bg-success/12' : 'bg-destructive/10'
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
                    className={`truncate text-lg font-bold ${
                      correct ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {question.targetExpressionText}
                  </span>
                  <span className="mt-0.5 truncate text-[13px] font-medium text-foreground/80">
                    {question.baseExpressionMeaningText}
                  </span>
                </span>
                {/* 색만으로 갈리지 않게 표시를 남긴다 */}
                <span
                  className={`ml-auto flex size-7 shrink-0 items-center justify-center rounded-full text-white ${
                    correct ? 'bg-success' : 'bg-destructive'
                  }`}
                >
                  {correct ? (
                    <CheckIcon size={16} strokeWidth={3} />
                  ) : (
                    <CloseIcon size={16} strokeWidth={3} />
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
