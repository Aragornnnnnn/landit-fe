'use client';

// 설문 완료 — 고맙다는 말과 이용권이 언제 어디로 오는지. 하트는 튕기며 나타난 뒤 두 번 뛰고 멈춘다
import { motion, useReducedMotion } from 'motion/react';

import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { REWARD_DATE } from '../model/questions';

export const SurveyDone = ({ onGoHome }: { onGoHome: () => void }) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          className="text-[120px] leading-none"
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {/* 등장이 끝난 뒤 심장 박동 두 번 — 계속 뛰면 정신없어서 처음 한 번만 */}
          <motion.div
            animate={reduced ? undefined : { scale: [1, 1.12, 1, 1.08, 1] }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeInOut' }}
          >
            <Emoji>💙</Emoji>
          </motion.div>
        </motion.div>
        <h1 className="mt-8 text-3xl leading-[1.3] font-black tracking-normal">
          소중한 의견 고마워요!
        </h1>
        <p className="mt-4 text-lg leading-snug font-bold break-keep text-muted-foreground">
          무료 이용권은 유료 전환일({REWARD_DATE})에
          <br />
          지금 로그인한 계정으로 넣어드릴게요
        </p>
      </div>

      <Button onClick={onGoHome}>홈으로</Button>
    </>
  );
};
