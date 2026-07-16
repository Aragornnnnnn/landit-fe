// 속마음 오버레이 — 화면 전체를 어둡게 덮고 랜디가 날아들어 속마음을 전한 뒤 사라진다 (섹션 밖 전면 연출)
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { ThoughtReveal, type FloatingThought } from './ThoughtReveal';

export const ThoughtOverlay = ({
  thought,
  // 대기 중(응답 전) — 랜디가 먼저 날아들어 '생각 중'으로 떠 있다가, 속마음이 도착하면 같은 말풍선이 채워진다
  loading = false,
}: {
  thought: FloatingThought | null;
  loading?: boolean;
}) => {
  const mounted = useClientOnlyValue(() => true, false);
  if (!mounted) return null;

  // 대기부터 속마음까지 랜디는 한 번만 등장한다 — 생성 중엔 구슬을 들고 있다가, 도착하면 표정으로 짜자잔 바뀐다
  const visible = loading || Boolean(thought);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="상대방 속마음"
          className="fixed inset-0 z-50 bg-black/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mx-auto flex h-full w-full max-w-[430px] flex-col items-center px-8 pt-24">
            <ThoughtReveal thought={thought} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
