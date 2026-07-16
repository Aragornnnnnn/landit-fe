// 온보딩 4단계 — 랜디가 상대 속마음을 대신 알려주는 걸 실제 오버레이 형태 그대로 박스 안에서 시연
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';

import {
  ThoughtReveal,
  type FloatingThought,
} from '@/features/conversation/ui/ThoughtReveal';
import { Button } from '@/shared/ui/Button';

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

        <div className="flex flex-1 items-center justify-center py-6">
          {/* 실제 속마음 오버레이(어두운 배경 + 날아드는 랜디)를 박스 안에 그대로 담는다 */}
          <div className="flex min-h-[340px] w-full items-center justify-center overflow-hidden rounded-[32px] bg-black/55 px-6">
            <AnimatePresence mode="wait">
              <ThoughtReveal key={index} thought={DEMOS[index]} />
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Button onClick={onNext}>이해했어요!</Button>
    </>
  );
};
