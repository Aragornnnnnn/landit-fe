// 온보딩 4단계 — 래디가 상대 속마음을 대신 알려주는 걸 실제 오버레이 형태 그대로 박스 안에서 시연
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';

import type { FloatingThought } from '@/features/conversation/model/thought'; // 온보딩 속마음 미리보기가 대화 엔진의 속마음 UI를 재사용한다
import { ThoughtReveal } from '@/features/conversation/ui/ThoughtReveal';
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
          상대 속마음을 알려줄게요
        </h1>

        {/* 박스가 실제로 받은 높이를 재는 컨테이너 — 낮은 화면에서 버튼이 밀려나지 않게 박스와 시연이 함께 줄어든다 */}
        <div className="[container-type:size] flex flex-1 items-center justify-center py-6">
          {/* 실제 속마음 오버레이(어두운 배경 + 날아드는 래디)를 박스 안에 그대로 담는다 */}
          <div className="flex h-[340px] max-h-full w-full items-center justify-center overflow-hidden rounded-[32px] bg-black/55 px-6">
            {/* 시연(래디 180px + 말풍선, 약 310px)이 박스보다 커지지 않게 구간별로 줄인다. 구간끼리는 겹치지 않는다 */}
            <div className="[@container(272px<=height<340px)]:[zoom:0.8] [@container(height<272px)]:[zoom:0.6]">
              <AnimatePresence mode="wait">
                <ThoughtReveal key={index} thought={DEMOS[index]} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onNext}>이해했어요!</Button>
    </>
  );
};
