// 온보딩 1단계 — 인사 + 서비스 핵심 가치 전달
'use client';

import { motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';

export const IntroStep = ({
  nickname,
  onNext,
}: {
  nickname: string | null;
  onNext: () => void;
}) => {
  return (
    <>
      <div className="flex flex-1 flex-col pt-7">
        <div className="space-y-5">
          <h1 className="text-3xl leading-[1.3] font-black tracking-normal">
            안녕하세요{nickname ? `, ${nickname}님` : ''}{' '}
            <motion.span
              className="tossface inline-block"
              animate={{ rotate: [0, 20, -10, 20, -5, 0] }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
            >
              👋
            </motion.span>
            <br />
            같이 편하게 이야기해봐요
          </h1>

          <p className="text-xl leading-snug font-bold">
            대화가 끝나면 외국인 귀에
            <br />
            어떻게 들렸는지 알려드릴게요
          </p>
        </div>

        {/* 인사하는 랜디를 중앙에 세워 첫인상을 잡는다 — 등장 후엔 좌우로 살랑살랑 움직이며 인사를 잇는다 */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <motion.img
              src="/images/character/landy-wave-smile.webp"
              alt="랜디"
              className="object-contain"
              style={{ width: 220, height: 220 }}
              animate={{
                x: [0, -12, 0, 12, 0],
                rotate: [0, -4, 0, 4, 0],
                y: [0, -8, 0, -8, 0],
              }}
              transition={{
                delay: 0.6,
                duration: 3.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </div>
      </div>

      <Button onClick={onNext}>좋아요!</Button>
    </>
  );
};
