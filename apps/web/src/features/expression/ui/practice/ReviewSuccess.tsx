'use client';

// 복습 영작 정답 연출 — '표현 획득!' 시트가 하단에서 튀어오르고, 획득한 표현 카드를 강조한다.
// 정답일 때만 부모가 마운트하므로, 마운트 시점에 콘페티를 1회 터뜨린다.
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

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
    const colors = ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'];
    // ticks 150 ≈ 2.5초(60fps 기준). 3발 합쳐 155개 — 화려하되 과하지 않게.
    const base = { spread: 70, startVelocity: 45, ticks: 150, colors };
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
    confetti({
      ...base,
      particleCount: 45,
      spread: 110,
      origin: { x: 0.5, y: 0.6 },
    });
  }, []);

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
    >
      <div className="mx-auto flex max-w-[430px] flex-col items-center gap-4 rounded-t-3xl bg-success/12 px-5 pt-7 pb-[max(env(safe-area-inset-bottom),24px)]">
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

        <Button variant="success" loading={finishing} onClick={onFinish}>
          학습 완료
        </Button>
      </div>
    </motion.div>
  );
};
