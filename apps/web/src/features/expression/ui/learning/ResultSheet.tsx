'use client';

// 퀴즈/복습 공용 하단 슬라이드업 결과 시트 — 정답(초록)/오답(빨강)을 알리고 CTA로 다음 스텝으로 넘어간다
import { motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';
import { CheckIcon, CloseIcon } from '@/shared/ui/Icons';

interface ResultSheetProps {
  tone: 'correct' | 'wrong';
  // 정답 문장 — 없으면 시트에 답을 싣지 않는다(곧 같은 문제를 다시 내는 복습의 오답)
  answer?: string;
  onNext: () => void;
  nextLabel: string;
}

export const ResultSheet = ({
  tone,
  answer,
  onNext,
  nextLabel,
}: ResultSheetProps) => {
  const correct = tone === 'correct';
  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
    >
      {/* 배경은 불투명해야 한다 — 반투명 틴트면 뒤의 퀴즈 내용이 비쳐 지저분하다. 같은 톤을 카드색과 섞어 쓴다 */}
      <div
        className={`mx-auto flex max-w-[430px] flex-col gap-3 rounded-t-3xl px-5 pt-5 pb-[max(env(safe-area-inset-bottom),24px)] ${
          correct
            ? 'bg-[color-mix(in_srgb,var(--success)_12%,var(--card))]'
            : 'bg-[color-mix(in_srgb,var(--destructive)_12%,var(--card))]'
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

        {/* 정답 문장 — 답을 감추는 호출부에선 아예 빠진다 */}
        {answer && (
          <>
            <p
              className={`text-xs font-bold ${correct ? 'text-success' : 'text-destructive'}`}
            >
              정답
            </p>
            <p className="-mt-2 text-base font-bold text-foreground">
              {answer}
            </p>
          </>
        )}

        <Button
          size="md"
          variant={correct ? 'success' : 'danger'}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      </div>
    </motion.div>
  );
};
