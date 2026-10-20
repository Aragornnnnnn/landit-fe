'use client';

// 복습 영작 정답 연출 — '표현 획득!' 시트가 하단에서 튀어오르고, 획득한 표현 카드를 강조한다.
// 정답일 때만 부모가 마운트하므로, 마운트 시점에 콘페티를 1회 터뜨린다.
import { useEffect } from 'react';
import { motion } from 'motion/react';

import { burstConfetti } from '@/shared/motion/confetti';
import { Button } from '@/shared/ui/Button';
import { CheckIcon } from '@/shared/ui/Icons';

interface ReviewSuccessProps {
  expression: string;
  meaning: string;
  onFinish: () => void;
  finishing: boolean;
}

export const ReviewSuccess = ({
  expression,
  meaning,
  onFinish,
  finishing,
}: ReviewSuccessProps) => {
  // 정답 순간 콘페티 — 브랜드 색으로 양쪽에서 터뜨린다
  useEffect(() => {
    burstConfetti();
  }, []);

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      {/* 배경은 불투명해야 한다 — 반투명 틴트면 뒤의 단어 칩이 비쳐 지저분하다(ResultSheet와 동일 처리) */}
      <div className="mx-auto flex max-w-[430px] flex-col items-center gap-4 rounded-t-3xl bg-[color-mix(in_srgb,var(--success)_12%,var(--card))] px-5 pt-7 pb-[max(var(--safe-area-inset-bottom),24px)]">
        {/* 획득 배지 */}
        <motion.div
          className="flex items-center gap-2 rounded-full bg-success px-4 py-1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 14,
            delay: 0.15,
          }}
        >
          <CheckIcon size={16} className="text-white" />
          <span className="text-sm font-extrabold text-white">표현 획득!</span>
        </motion.div>

        {/* 획득한 표현 카드 */}
        <motion.div
          className="w-full rounded-2xl border border-success/30 bg-card px-5 py-4 text-center shadow-md"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 18,
            delay: 0.25,
          }}
        >
          <p className="text-2xl font-extrabold text-success">{expression}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {meaning}
          </p>
        </motion.div>

        <Button
          size="md"
          variant="success"
          loading={finishing}
          onClick={onFinish}
        >
          학습 완료
        </Button>
      </div>
    </motion.div>
  );
};
