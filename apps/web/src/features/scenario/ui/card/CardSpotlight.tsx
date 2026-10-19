'use client';

// 카드 위의 스포트라이트 — 화면을 어둡게 덮고 한 자리만 뚫어 둔다. 그 자리에 꼬리가 닿는 말풍선이 붙는다.
// 소개(introMs)는 잠깐 보여 준 뒤 저절로 넘어가고 눌러도 넘어간다. 그 밖에는 뚫린 자리만 눌린다(손가락이 콕콕 가리킨다). 첫 표현 투어에서 첫 표현으로 이끈다
import { useEffect, useEffectEvent, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import { DURATION } from '@/shared/motion';
import { Emoji } from '@/shared/ui/emoji';

// 뚫린 자리를 대상보다 조금 넓게 — 테두리가 대상에 붙지 않게
const PAD = 6;
// 말풍선과 뚫린 자리 사이 — 꼬리가 이 틈을 잇는다
const GAP = 14;
// 손가락 자리 — 칸 오른쪽 끝의 「무료」 배지(약 52px)와 겹치지 않게 그 왼쪽, 칸 높이의 40% 지점
const FINGER_FROM_RIGHT_PX = 118;
const FINGER_TOP_RATIO = 0.4;

export const CardSpotlight = ({
  findTarget,
  label,
  settleMs,
  children,
  onTap,
  introMs,
  onMissing,
  onSkip,
}: {
  // 뚫어 둘 자리를 찾는다 — 연출이 끝난 뒤에 찾아야 그 자리가 맞다
  findTarget: () => HTMLElement | null;
  // 뚫린 자리 버튼의 이름(스크린리더)
  label: string;
  // 카드 연출(뒤집기 등)이 끝난 뒤의 자리를 재려고 기다리는 시간
  settleMs: number;
  // 말풍선의 말
  children: React.ReactNode;
  onTap: () => void;
  // 주면 소개 말풍선 — 뜬 뒤 이만큼 지나면 저절로 넘어가고(onTap), 화면 어디를 눌러도 넘어간다
  introMs?: number;
  // 기다린 뒤에도 자리를 못 찾았다 — 비출 것이 없으니 부르는 쪽이 안내를 끝낸다
  onMissing?: () => void;
  // 주면 아래에 「다음에 할게요」를 둔다 — 뚫린 자리 말고도 빠져나갈 길
  onSkip?: () => void;
}) => {
  const intro = introMs !== undefined;
  const reduced = useReducedMotion();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measureTarget = useEffectEvent((first: boolean) => {
    const target = findTarget();
    if (!target) {
      if (first) onMissing?.();
      return;
    }
    // 목록이 길어 칸이 화면 밖이면 먼저 가운데로 데려온다 — 어둠이 스크롤을 막는다
    if (first) target.scrollIntoView({ block: 'center' });
    setRect(target.getBoundingClientRect());
  });
  useEffect(() => {
    const measure = () => measureTarget(false);
    const timer = setTimeout(() => measureTarget(true), settleMs);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [settleMs]);

  // 소개는 말풍선이 뜬 뒤부터 센다 — 자리를 재기 전에는 아무것도 안 보인다
  const advance = useEffectEvent(onTap);
  const shown = rect !== null;
  useEffect(() => {
    if (!shown || introMs === undefined) return;
    const timer = setTimeout(advance, introMs);
    return () => clearTimeout(timer);
  }, [shown, introMs]);

  if (!rect) return null;
  const hole = {
    left: rect.left - PAD,
    top: rect.top - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.base }}
      onClick={intro ? onTap : undefined}
    >
      {/* 뚫린 자리 밖을 어둡게 — 큰 그림자로 덮고, 자리 밖의 누름은 이 칸이 다 받는다 */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-[22px] shadow-[0_0_0_9999px_rgba(0,0,0,0.62)] ring-3 ring-[#ffd25e]"
        style={hole}
      />
      {/* 누르는 손가락 — 무료 배지 왼쪽에서 칸을 콕콕 누른다 */}
      {!intro && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute text-[34px] drop-shadow-md"
          style={{
            left: hole.left + hole.width - FINGER_FROM_RIGHT_PX,
            top: hole.top + hole.height * FINGER_TOP_RATIO,
          }}
          animate={reduced ? undefined : { y: [0, -8, 0], scale: [1, 0.92, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Emoji>👆</Emoji>
        </motion.span>
      )}
      {/* 말풍선 — 꼬리가 위로 뚫린 자리에 닿는다. 누구의 말도 아닌 안내라 캐릭터 없이 */}
      <motion.div
        className="pointer-events-none absolute right-0 left-0 flex justify-center px-6"
        style={{ top: hole.top + hole.height + GAP }}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: DURATION.base, delay: 0.15 }}
      >
        <p className="relative rounded-2xl bg-card px-5 py-3.5 text-center text-base leading-snug font-bold break-keep text-foreground shadow-lg">
          <span
            aria-hidden
            className="absolute -top-1.5 left-1/2 size-3.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-card"
          />
          {children}
        </p>
      </motion.div>
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="absolute inset-x-0 bottom-[max(var(--safe-area-inset-bottom),20px)] mx-auto w-fit px-4 py-3 text-base font-semibold text-white/75 underline-offset-4 active:underline"
        >
          다음에 할게요
        </button>
      )}
      {!intro && (
        <button
          type="button"
          aria-label={label}
          className="absolute rounded-[22px]"
          style={hole}
          onClick={onTap}
        />
      )}
    </motion.div>,
    document.body,
  );
};
