// 랜디 안내 오버레이 — 화면 전체를 어둡게 덮고 랜디가 날아들어 한마디 전한 뒤 사라진다 (섹션 밖 전면 연출).
// 상대 속마음은 말풍선 맨 위 줄로 옮겼고, 지금은 내가 먼저 거는 대화의 진입 안내만 쓴다
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import type { FloatingThought } from '../../model/thought';
import { preloadThoughtImages, ThoughtReveal } from '../ThoughtReveal';

export const ThoughtOverlay = ({
  thought,
}: {
  thought: FloatingThought | null;
}) => {
  const t = useTranslations('conversation.thoughtOverlay');
  const mounted = useClientOnlyValue(() => true, false);
  // 대화 화면에 들어올 때부터 받아 둔다 — 안내가 뜨자마자 래디가 바로 보인다
  preloadThoughtImages();
  if (!mounted) return null;

  const visible = Boolean(thought);

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t('dialogLabel')}
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
