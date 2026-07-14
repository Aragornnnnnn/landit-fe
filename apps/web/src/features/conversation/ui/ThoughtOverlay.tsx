// 속마음 오버레이 — 화면 전체를 어둡게 덮고 Sona가 날아들어 속마음을 전한 뒤 사라진다 (섹션 밖 전면 연출)
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';

import type { FloatingThought } from '@/features/onboarding/ui/ThoughtCard';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

export const ThoughtOverlay = ({
  thought,
}: {
  thought: FloatingThought | null;
}) => {
  const mounted = useClientOnlyValue(() => true, false);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {thought && (
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
            {/* Sona — 오른쪽 아래에서 호를 그리며 화면 상단으로 날아든다 */}
            <motion.div
              initial={{ x: 240, y: 150, rotate: 16, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              exit={{ x: -240, y: 80, rotate: -16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 190, damping: 21 }}
              className="flex flex-col items-center"
            >
              {/* 떠 있는 동안 둥실둥실 */}
              <motion.div
                animate={{ y: [0, -9, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/character/sona-${thought.type.toLowerCase()}.webp`}
                  alt="Sona"
                  className="object-contain"
                  style={{ width: 148, height: 148 }}
                />
              </motion.div>

              {/* 말풍선 — 착지 직후 통통 튀며 열리고, 글자가 촤르륵 이어진다 */}
              <motion.div
                initial={{ scale: 0.7, y: 12, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{
                  delay: 0.24,
                  type: 'spring',
                  stiffness: 320,
                  damping: 19,
                }}
                className="relative mt-5 rounded-3xl bg-card px-6 py-4.5 shadow-xl"
                role="status"
              >
                {/* 위쪽 꼬리 */}
                <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[3px] bg-card" />
                {/* Sona가 대신 전해주는 프레임 — 속마음 본문은 상대의 목소리라 따옴표로 감싼다 */}
                <p className="mb-1.5 text-center text-xs font-bold text-primary">
                  대신 알려주는 속마음
                </p>
                <p className="text-center text-base leading-relaxed font-medium text-foreground">
                  {`“${thought.text}”`.split('').map((char, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.32 + i * 0.014, duration: 0.12 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
