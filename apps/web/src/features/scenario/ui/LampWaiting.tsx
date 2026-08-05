'use client';

// 대기면 — 래디가 램프에서 자고 있다. 깨워야 오늘 대화가 시작된다
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import { Button } from '@/shared/ui/Button';

interface LampWaitingProps {
  // 램프를 문질러 래디를 부른다. 서버가 시작 불가로 판정하면 넘어오지 않는다
  onSummon?: () => void;
  // 전날 시작했다 못 끝내 다시 받은 카드는 "도착"이 아니라 이어서 하는 것이다
  retry?: boolean;
}

export const LampWaiting = ({ onSummon, retry = false }: LampWaitingProps) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="flex h-full w-full flex-col items-center rounded-3xl bg-card px-6 pt-8 pb-6">
      {/* break-keep이 없으면 좁은 화면에서 "있어 / 요"로 갈린다 */}
      <p className="text-center text-lg leading-snug font-extrabold break-keep text-foreground">
        {retry
          ? '어제 마치지 못한 대화가 남아 있어요'
          : '래디가 램프에서 기다리고 있어요'}
      </p>
      <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
        밤 12시가 지나면 오늘의 대화가 사라져요
      </p>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        {/* 램프 크기에 맞춘 상자 — zZ가 화면이 아니라 램프를 기준으로 떠야 한다 */}
        <div className="relative w-full max-w-[330px]">
          {/* 이미지 안에도 zZ가 그려져 있다 — 이건 그 위로 한 겹 더 떠오르는 쪽 */}
          {!reduced && (
            <motion.span
              aria-hidden
              className="absolute -top-2 right-[18%] font-bold text-muted-foreground"
              animate={{ y: [8, -6], opacity: [0, 1, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
            >
              z Z
            </motion.span>
          )}

          {/* 잠든 숨 — 시안은 4.1초 타임라인 안의 한 번짜리 동작이라 진폭만 가져오고 주기를 늦췄다.
              여기는 계속 머무는 화면이라 그대로 쓰면 헐떡이는 것처럼 보인다 */}
          <motion.div
            animate={reduced ? undefined : { scale: [1, 1.015, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/images/character/landy-lamp-sleeping.webp"
              alt=""
              width={330}
              height={264}
              className="w-full"
            />
          </motion.div>
        </div>
      </div>

      <Button onClick={onSummon} disabled={!onSummon}>
        램프 문질러 대화 시작하기
      </Button>
    </div>
  );
};
