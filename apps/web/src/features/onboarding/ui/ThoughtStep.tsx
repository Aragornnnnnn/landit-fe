// 온보딩 4단계 — 랜디가 상대 속마음을 대신 알려주는 걸 표정별로 시연
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';

import { ThoughtCard, type FloatingThought } from './ThoughtCard';

const DEMOS: FloatingThought[] = [
  { type: 'GOOD', text: '오, 이유까지 말해주네. 대화 잘 통한다!' },
  { type: 'NORMAL', text: '무슨 말인지 알겠어. 잘 전해졌어.' },
  { type: 'BAD', text: '살짝 갸웃했어. 다음엔 천천히 말해줘!' },
];

export const ThoughtStep = ({ onNext }: { onNext: () => void }) => {
  const [index, setIndex] = useState(0);

  // 표정·예시가 하나씩 바뀌며 반복 시연
  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((p) => (p + 1) % DEMOS.length),
      2600,
    );
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <>
      <div className="flex flex-1 flex-col pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          말할 때마다 나와서
          <br />
          상대 속마음을 대신 알려줄게요
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex min-h-30 w-full items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex w-full justify-center"
              >
                <ThoughtCard thought={DEMOS[index]} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Button onClick={onNext}>이해했어요!</Button>
    </>
  );
};
