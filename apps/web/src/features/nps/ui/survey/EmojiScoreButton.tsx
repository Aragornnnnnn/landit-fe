'use client';

import { AnimatePresence, motion } from 'motion/react';

import type { NpsScore } from '../../api/nps';

// 점수 → 표정 매핑 — Record라 점수가 늘면 표정을 채워야 컴파일된다
const EMOJIS: Record<NpsScore, string> = {
  1: '😩',
  2: '😟',
  3: '😶',
  4: '😄',
  5: '🤩',
};
// 표정 버튼 하나 — 첫 등장 스태거, 선택 시 확대·점프, 미선택은 흐리게, 바닥에 선택 점
export const EmojiScoreButton = ({
  value,
  score,
  onSelect,
}: {
  value: NpsScore;
  score: NpsScore | null;
  onSelect: (value: NpsScore) => void;
}) => {
  const selected = score === value;
  const dimmed = score !== null && !selected;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(value)}
      aria-label={`만족도 ${value}점`}
      aria-pressed={selected}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: selected ? 1.25 : 1,
        opacity: dimmed ? 0.3 : 1,
        y: selected ? -6 : 0,
      }}
      transition={{
        scale: {
          type: 'spring',
          stiffness: 420,
          damping: 18,
          // 스태거는 첫 등장에만 — 선택 이후의 변화는 즉시 반응해야 한다
          delay: score === null ? 0.05 + (value - 1) * 0.07 : 0,
        },
        opacity: { duration: 0.15 },
        y: { type: 'spring', stiffness: 420, damping: 18 },
      }}
      whileTap={{ scale: 0.8 }}
      className="relative flex flex-col items-center pb-3"
    >
      <span className="tossface text-4xl">{EMOJIS[value]}</span>
      <AnimatePresence>
        {selected && (
          <motion.div
            key="dot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute bottom-0 h-1.5 w-1.5 rounded-full bg-primary"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};
