'use client';

// 프리미엄 온보딩의 첫 화면(환영) — 래디·PREMIUM·"환영해요"는 처음부터 있고, 서리 낀 혜택 카드의 자물쇠가 풀리며 막이 위에서 아래로 걷히고 줄마다 체크가 들어온다.
// 다 열리면 꽃가루와 함께 「다음」이 나온다 (피그마 3008:2 S1 v2)
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
} from 'motion/react';
import Image from 'next/image';

import {
  PREMIUM_BENEFITS,
  type BenefitIcon,
} from '@/features/subscription/model/product/benefits';
import { PremiumPill } from '@/features/subscription/ui/premium-brand';
import { useAuthStore } from '@/shared/auth/auth-store';
import { haptic } from '@/shared/haptics';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

// 혜택 줄 앞 토스페이스 — 페이월·구독 관리의 라인 아이콘 대신, 축하 화면이라 그림 이모지를 쓴다
const BENEFIT_EMOJI: Record<BenefitIcon, string> = {
  calendar: '🗓️',
  'list-checks': '📝',
  sparkles: '💡',
  mic: '🎤',
  chat: '💬',
  globe: '🌍',
};

// 연출 시각(ms) — 자물쇠가 풀리고, 막이 걷히기 시작하고, 다 열린다
const UNLOCK_AT_MS = 900;
const REVEAL_AT_MS = 1300;
const REVEAL_S = 0.8;
// 마지막 줄 체크가 튀고 난 뒤에 꽃가루와 「다음」
const OPEN_AT_MS = REVEAL_AT_MS + REVEAL_S * 1000 + 250;

// 막은 일정한 속도로 내려가므로, 줄 한가운데를 지나는 순간에 그 줄의 체크를 넣는다
const checkDelay = (index: number) =>
  ((index + 0.5) / PREMIUM_BENEFITS.length) * REVEAL_S;

type Phase = 'locked' | 'unlocked' | 'revealing' | 'open';

// 자물쇠 — 잠겨 있다가, 풀릴 때 한 번 튀고, 막이 걷히기 시작하면 사라진다
const LOCK_MOTION: Record<Phase, TargetAndTransition> = {
  locked: { scale: 1, y: 0, opacity: 1 },
  unlocked: { scale: [1, 1.25, 1.05], y: [0, -10, 0], opacity: 1 },
  revealing: { scale: 1.05, y: 0, opacity: 0 },
  open: { scale: 1.05, y: 0, opacity: 0 },
};

const Padlock = ({ open }: { open: boolean }) => (
  <svg viewBox="0 -6 56 70" className="h-[70px] w-14" aria-hidden>
    {/* 풀리면 고리가 솟아 오른쪽 다리가 몸통에서 빠진다 — 왼쪽 다리는 몸통에 꽂힌 채로 */}
    <motion.path
      fill="none"
      stroke="#9aa3ad"
      strokeWidth={7}
      strokeLinecap="round"
      initial={false}
      animate={{
        d: open
          ? 'M14 30V12a14 14 0 0 1 28 0v3'
          : 'M14 30V20a14 14 0 0 1 28 0v10',
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 16 }}
    />
    <rect x="4" y="28" width="48" height="34" rx="9" fill="#aab3bd" />
    <circle cx="28" cy="43" r="5" fill="#6b7580" />
    <rect x="25.5" y="44" width="5" height="10" rx="2.5" fill="#6b7580" />
  </svg>
);

const CheckBadge = () => (
  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
    <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="white"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const burst = () => {
  const base = {
    spread: 75,
    startVelocity: 42,
    ticks: 160,
    colors: ['#e07a3a', '#7c4dbe', '#f7cf5c', '#4ea8de', '#2f7d54'],
    disableForReducedMotion: true,
  };
  confetti({
    ...base,
    particleCount: 50,
    angle: 60,
    origin: { x: 0, y: 0.35 },
  });
  confetti({
    ...base,
    particleCount: 50,
    angle: 120,
    origin: { x: 1, y: 0.35 },
  });
};

export const PremiumWelcome = ({ onNext }: { onNext: () => void }) => {
  const reduced = useReducedMotion();
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const [phase, setPhase] = useState<Phase>(reduced ? 'open' : 'locked');

  useEffect(() => {
    if (reduced) return;
    const timers = [
      setTimeout(() => {
        setPhase('unlocked');
        haptic('medium');
      }, UNLOCK_AT_MS),
      setTimeout(() => setPhase('revealing'), REVEAL_AT_MS),
      setTimeout(() => {
        setPhase('open');
        haptic('success');
        burst();
      }, OPEN_AT_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const revealing = phase === 'revealing' || phase === 'open';

  return (
    <main className="flex h-dvh flex-col bg-background px-6 pt-[max(var(--safe-area-inset-top),16px)] pb-[max(var(--safe-area-inset-bottom),20px)]">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <div className="relative">
          {/* 래디 뒤 은은한 빛 */}
          <div
            aria-hidden
            className="absolute inset-[-20%] rounded-full bg-[radial-gradient(circle,rgba(247,170,90,0.28),transparent_65%)]"
          />
          <Image
            src="/images/character/landy-point.webp"
            alt=""
            width={180}
            height={180}
            priority
            className="relative h-[clamp(96px,20dvh,180px)] w-auto"
          />
        </div>

        <div className="mt-3">
          <PremiumPill />
        </div>
        <h1 className="mt-3 text-center text-[24px] leading-snug font-black text-balance text-foreground short:text-[21px]">
          {nickname ? `환영해요, ${nickname}님!` : '환영해요!'}
          <br />
          이제 랜딧을 마음껏 즐겨요
        </h1>

        <div className="relative mt-7 w-full overflow-hidden rounded-[22px] border border-border bg-card short:mt-4">
          <ul className="flex flex-col px-4">
            {PREMIUM_BENEFITS.map((benefit, index) => (
              <li
                key={benefit.text}
                className="flex items-center gap-3 border-b border-border/60 py-3.5 last:border-b-0 short:py-2.5"
              >
                <Emoji className="size-6 shrink-0">
                  {BENEFIT_EMOJI[benefit.icon]}
                </Emoji>
                <span className="min-w-0 flex-1 text-[15px] font-bold text-foreground">
                  {benefit.text}
                </span>
                <motion.span
                  initial={false}
                  animate={
                    revealing
                      ? { scale: 1, opacity: 1 }
                      : { scale: 0.4, opacity: 0 }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 520,
                    damping: 18,
                    delay: reduced ? 0 : checkDelay(index),
                  }}
                >
                  <CheckBadge />
                </motion.span>
              </li>
            ))}
          </ul>

          {/* 서리 막 — 카드 아래로 밀려 내려가며 위부터 걷힌다. 잘라 내면(clip-path) 크로미움의 블러가 따라오지 않는다 */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{ y: revealing ? '100%' : '0%' }}
            transition={{ duration: REVEAL_S, ease: 'linear' }}
            className="absolute inset-0 flex items-center justify-center bg-card/55 backdrop-blur-[6px]"
          >
            <motion.div
              animate={LOCK_MOTION[phase]}
              transition={{ duration: phase === 'unlocked' ? 0.4 : 0.25 }}
            >
              <Padlock open={phase !== 'locked'} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={
          phase === 'open' ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
        }
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`pt-4 ${phase === 'open' ? '' : 'pointer-events-none'}`}
      >
        <Button onClick={onNext}>다음</Button>
      </motion.div>
    </main>
  );
};
