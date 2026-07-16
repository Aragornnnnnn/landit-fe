// 랜디가 날아들어 속마음을 전하는 연출 — 전면 오버레이(ThoughtOverlay)와 온보딩 박스가 공유하는 속마음 UI
'use client';

import { motion } from 'motion/react';

export type ThoughtType = 'GOOD' | 'NORMAL' | 'BAD';

export interface FloatingThought {
  text: string;
  type: ThoughtType;
}

// 오른쪽 아래에서 호를 그리며 날아들고, 밀려날 땐 왼쪽으로 빠진다.
// AnimatePresence 자식(오버레이는 백드롭 경유, 온보딩은 직접)일 때 이 initial/exit가 재생된다.
// thought가 null이면 대기(구슬 든 랜디 + 생각 점), 있으면 표정 랜디 + 속마음 본문.
export const ThoughtReveal = ({
  thought,
}: {
  thought: FloatingThought | null;
}) => {
  const hasThought = Boolean(thought);
  const landyType = (thought?.type ?? 'NORMAL').toLowerCase();
  // 생성 중 = 구슬 든 랜디, 도착 = 감정 표정 랜디
  const characterSrc = hasThought
    ? `/images/character/landy-${landyType}.webp`
    : '/images/character/landy-orb.webp';

  return (
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
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 구슬↔표정 전환 시 통 튀며 짜자잔 */}
        <motion.div
          key={hasThought ? 'thought' : 'orb'}
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 480, damping: 15 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={characterSrc}
            alt="랜디"
            className="object-contain"
            style={{ width: 148, height: 148 }}
          />
        </motion.div>
      </motion.div>

      {/* 말풍선 — 착지 직후 통통 튀며 열리고, 대기 땐 점, 도착하면 글자가 촤르륵 이어진다 */}
      <motion.div
        layout
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
        {thought ? (
          <>
            {/* 랜디가 대신 전해주는 프레임 — 속마음 본문은 상대의 목소리라 따옴표로 감싼다 */}
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
          </>
        ) : (
          // 대기 — 상대가 마음을 정리하는 중
          <div
            className="flex items-center gap-2 px-2 py-1.5"
            aria-label="상대가 생각하고 있어요"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-2.5 rounded-full bg-muted-foreground/60"
                animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
