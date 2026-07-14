'use client';

// 퀴즈/복습 공용 하단 슬라이드업 결과 시트 — 정답(초록)/오답(빨강) 모두 정답 문장을 보여주고 CTA로 다음 스텝으로 넘어간다
import { motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';
import { CheckIcon, CloseIcon } from '@/shared/ui/Icons';

interface ResultSheetProps {
  tone: 'correct' | 'wrong';
  answer: string;
  onNext: () => void;
  nextLabel: string;
  finishing: boolean;
}

export const ResultSheet = ({
  tone,
  answer,
  onNext,
  nextLabel,
  finishing,
}: ResultSheetProps) => {
  const correct = tone === 'correct';
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
    >
      <div
        className={`mx-auto flex max-w-[430px] flex-col gap-3 rounded-t-3xl px-5 pt-5 pb-[max(env(safe-area-inset-bottom),24px)] ${
          correct ? 'bg-success/12' : 'bg-destructive/12'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex size-7 items-center justify-center rounded-full text-white ${
              correct ? 'bg-success' : 'bg-destructive'
            }`}
          >
            {correct ? <CheckIcon size={17} /> : <CloseIcon size={17} />}
          </span>
          <p
            className={`text-lg font-extrabold ${
              correct ? 'text-success' : 'text-destructive'
            }`}
          >
            {correct ? '정답이에요!' : '아쉬워요'}
          </p>
        </div>

        {/* 정답 문장 — 정답·오답 동일하게 노출 */}
        <p
          className={`text-xs font-bold ${correct ? 'text-success' : 'text-destructive'}`}
        >
          정답
        </p>
        <p className="-mt-2 text-base font-bold text-foreground">{answer}</p>

        <Button
          variant={correct ? 'success' : 'danger'}
          loading={finishing}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      </div>
    </motion.div>
  );
};
