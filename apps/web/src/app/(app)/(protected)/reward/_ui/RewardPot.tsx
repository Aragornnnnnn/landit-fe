'use client';

// 돈통 그림 — 상태에 맞는 한 장을 보여 주고, 오늘 몫을 받았으면 들어올 때 동전이 떨어진다
import { motion, useReducedMotion } from 'motion/react';
import Image, { type StaticImageData } from 'next/image';

import potComplete from '@/features/reward/assets/reward-pot-complete.webp';
import { Coin } from '@/features/reward/ui/common/Coin';

import potEmpty from '../_assets/pot-empty.webp';
import potKept from '../_assets/pot-kept.webp';
import potRested from '../_assets/pot-rested.webp';
import potUrgent from '../_assets/pot-urgent.webp';
import type { PotStage } from '../_model/pot-stage';

const ART: Record<PotStage, StaticImageData | string> = {
  empty: potEmpty,
  // 홈의 램프가 쓰는 잠자는 래디와 같은 그림이다
  waiting: '/images/character/landy-lamp-sleeping.webp',
  urgent: potUrgent,
  rested: potRested,
  kept: potKept,
  complete: potComplete,
};

export const RewardPot = ({
  stage,
  dropsCoin,
}: {
  stage: PotStage;
  // 오늘 몫을 받았으면 들어올 때 동전 하나가 떨어진다
  dropsCoin: boolean;
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
          src={ART[stage]}
          alt=""
          fill
          sizes="240px"
          className="object-contain"
          priority
        />
      </motion.div>

      {!reduced && dropsCoin && (
        <motion.span
          aria-hidden
          className="absolute top-0 left-1/2 -ml-3.5"
          initial={{ y: -70, opacity: 0, rotate: -30 }}
          // 통에 닿으면 사라진다 — 숫자가 그만큼 올라가는 것으로 이어진다
          animate={{
            y: [-70, 96, 88],
            opacity: [0, 1, 1, 0],
            rotate: 20,
          }}
          transition={{
            delay: 0.25,
            duration: 0.62,
            ease: 'easeIn',
            opacity: { times: [0, 0.15, 0.85, 1] },
          }}
        >
          <Coin size={28} />
        </motion.span>
      )}
    </div>
  );
};
