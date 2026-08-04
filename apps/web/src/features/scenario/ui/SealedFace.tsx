'use client';

// 봉인면 — 오늘 뭘 하는지는 대화에 들어가서 안다. 여기서는 카드가 왔다는 것과 누르면 된다는 것만 알린다
import { motion } from 'motion/react';
import Image from 'next/image';

import { ArrowRightIcon } from '@/shared/ui/Icons';

import { SHIMMER } from '../lib/shimmer';

// 표면에 흩뿌리는 반짝임 — 위치·크기·박자를 조금씩 어긋나게 둬야 규칙적으로 안 보인다
const SPARKLES: {
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: number;
}[] = [
  { top: '16%', left: '14%', size: 11, delay: 0 },
  { top: '26%', right: '13%', size: 15, delay: 0.7 },
  { top: '62%', left: '11%', size: 9, delay: 1.4 },
  { top: '72%', right: '15%', size: 12, delay: 0.35 },
];

interface SealedFaceProps {
  // 서버가 시작 불가로 판정하면 넘어오지 않는다 — 그때는 눌리지 않는 카드가 된다
  onStart?: () => void;
  // 전날 시작했다 못 끝내 다시 받은 카드는 "도착"이 아니라 이어서 하는 것이다
  retry?: boolean;
  reduced: boolean;
}

export const SealedFace = ({
  onStart,
  retry = false,
  reduced,
}: SealedFaceProps) => (
  // 카드 전체가 하나의 버튼이다 — 따로 놓인 CTA보다 "이 카드를 연다"는 결에 가깝다
  <button
    type="button"
    onClick={onStart}
    disabled={!onStart}
    aria-label={retry ? '이어서 대화하기' : '오늘 대화 시작하기'}
    className="relative flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl px-6 py-10 text-primary-foreground shadow-[0_18px_40px_-12px_rgba(150,60,10,0.55)] ring-1 ring-white/25 transition-transform [background:radial-gradient(125%_95%_at_18%_8%,#f5b177_0%,#e8935a_28%,#d9702f_62%,#a94a13_100%)] ring-inset active:scale-[0.985]"
  >
    {/* 표면에 천천히 흐르는 빛덩이 — 정지된 그림이 아니라 살아 있는 표면처럼 보이게 */}
    <motion.span
      aria-hidden
      className="absolute -top-20 -left-12 size-56 rounded-full bg-white/15 blur-xl"
      animate={reduced ? undefined : { x: [0, 26, 0], y: [0, 18, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.span
      aria-hidden
      className="absolute -right-16 -bottom-24 size-72 rounded-full bg-black/12 blur-xl"
      animate={reduced ? undefined : { x: [0, -22, 0], y: [0, -16, 0] }}
      transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* 빛 쓸기 — 주기적으로 카드 위를 훑는다. 기울인 만큼 위아래로 넉넉히 빼야 모서리가 안 잘린다 */}
    {!reduced && (
      <motion.span
        aria-hidden
        className="absolute -inset-y-1/4 -left-1/2 w-1/3 rotate-12 bg-linear-to-r from-transparent via-white/35 to-transparent"
        animate={{ x: ['0%', '460%'] }}
        transition={{ ...SHIMMER, repeat: Infinity }}
      />
    )}

    {!reduced &&
      SPARKLES.map((sparkle, index) => (
        <motion.span
          key={index}
          aria-hidden
          className="absolute text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            right: sparkle.right,
            fontSize: sparkle.size * 1.5,
            lineHeight: 1,
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.15, 0.6] }}
          transition={{
            duration: 2.1,
            repeat: Infinity,
            repeatDelay: 1.1,
            delay: sparkle.delay,
            ease: 'easeInOut',
          }}
        >
          ✦
        </motion.span>
      ))}

    <span className="relative text-center text-[22px] leading-snug font-extrabold drop-shadow-sm">
      {retry ? (
        <>
          어제 마치지 못한 대화가
          <br />
          기다리고 있어요
        </>
      ) : (
        <>
          오늘의 대화가
          <br />
          도착했어요
        </>
      )}
    </span>

    <span className="relative flex items-center justify-center">
      {/* 래디 뒤에서 번지는 빛 */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute size-52 rounded-full bg-amber-200/40 blur-2xl"
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.9, 1.12, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <Image
        src="/images/character/landy-chat.webp"
        alt=""
        width={220}
        height={220}
        className="relative w-52 drop-shadow-[0_10px_20px_rgba(120,50,10,0.45)]"
        priority
      />
    </span>

    {/* 누를 수 있다는 걸 알약 모양으로 못박는다 — 카드 전체가 버튼이라 안에 또 버튼을 넣지는 않는다 */}
    <motion.span
      className="relative flex items-center gap-1.5 rounded-full bg-white/25 px-5 py-2.5 text-[15px] font-bold backdrop-blur-sm"
      animate={reduced ? undefined : { scale: [1, 1.04, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {retry ? '눌러서 이어하기' : '눌러서 시작하기'}
      <ArrowRightIcon size={16} />
    </motion.span>
  </button>
);
