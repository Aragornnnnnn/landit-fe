// 온보딩 마지막 — 램프에서 래디가 빼꼼 내다본다. 누르면 홈에서 그 램프가 열린다
'use client';

import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import { Button } from '@/shared/ui/Button';

import lampPeekImage from '../../assets/landy-lamp-peek.webp';

// 달그락 — 안에 뭔가 있다는 신호. 홈의 등장 연출(±14도로 일곱 번)에서 진폭을 줄이고
// 쉬는 틈을 둬 반복시킨다. 계속 머무는 화면이라 그대로 쓰면 안절부절못하는 것처럼 보인다
const RATTLE = {
  animate: { rotate: [0, -4, 3, -3, 2, 0] },
  transition: {
    duration: 0.9,
    repeat: Infinity,
    repeatDelay: 1.6,
    ease: 'easeInOut' as const,
  },
};

export const LampStep = ({ onStart }: { onStart: () => void }) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          준비는 끝났어요
          <br />
          오늘의 대화가 기다려요
        </h1>

        {/* 램프가 무엇인지 글로 설명하지 않는다 — 여기선 처음 보는 물건이라 말이 겉돈다.
            홈에서 열리는 걸 본 뒤에야 "래디가 램프에서 기다린다"는 문장이 말이 된다 */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            className="w-full max-w-[280px] origin-bottom"
            {...(reduced ? {} : RATTLE)}
          >
            <Image
              src={lampPeekImage}
              alt=""
              sizes="280px"
              placeholder="blur"
              priority
              className="w-full"
            />
          </motion.div>
        </div>
      </div>

      <Button onClick={onStart}>시작할게요!</Button>
    </>
  );
};
