'use client';

// 돈통 그림 — 상태에 맞는 한 장을 보여 주고, 오늘 받은 게 있으면 들어올 때 동전이 떨어진다
import { motion, useReducedMotion } from 'motion/react';
import Image, { type StaticImageData } from 'next/image';

import coinImage from '@/features/reward/assets/coin.png';
import potComplete from '@/features/reward/assets/refund-pot-complete.png';

import potEmpty from '../_assets/pot-empty.png';
import potKept from '../_assets/pot-kept.png';
import potLost from '../_assets/pot-lost.png';
import potWaiting from '../_assets/pot-waiting.png';
import type { PotArt } from '../_model/pot-stage';

const ART: Record<PotArt, StaticImageData | string> = {
  // 홈의 램프가 쓰는 잠자는 래디와 같은 그림이다
  sleeping: '/images/character/landy-lamp-sleeping.webp',
  empty: potEmpty,
  lost: potLost,
  waiting: potWaiting,
  kept: potKept,
  complete: potComplete,
};

// 동전이 떨어지는 가로 자리 — 가운데에서 좌우로 조금씩 흩는다
const DROP_X = [0, -34, 30];

export const RefundPot = ({
  art,
  // 오늘 채운 칸 수만큼 동전이 떨어진다 (0~3)
  drops,
}: {
  art: PotArt;
  drops: number;
}) => {
  const reduced = useReducedMotion();

  return (
    <div className="relative h-[180px] w-[240px]">
      <motion.div
        className="relative size-full"
        initial={reduced ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        <Image
          src={ART[art]}
          alt=""
          fill
          sizes="240px"
          className="object-contain"
          priority
        />
      </motion.div>

      {!reduced &&
        DROP_X.slice(0, drops).map((x, index) => (
          <motion.span
            key={x}
            aria-hidden
            className="absolute top-0 left-1/2 -ml-3.5"
            initial={{ x, y: -70, opacity: 0, rotate: -30 }}
            // 통에 닿으면 사라진다 — 숫자가 그만큼 올라가는 것으로 이어진다
            animate={{
              y: [-70, 96, 88],
              opacity: [0, 1, 1, 0],
              rotate: 20,
            }}
            transition={{
              delay: 0.25 + index * 0.16,
              duration: 0.62,
              ease: 'easeIn',
              opacity: { times: [0, 0.15, 0.85, 1] },
            }}
          >
            <Image src={coinImage} alt="" width={28} height={28} />
          </motion.span>
        ))}
    </div>
  );
};
