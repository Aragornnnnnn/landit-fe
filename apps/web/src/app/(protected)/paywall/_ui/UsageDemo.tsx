'use client';

// 「이렇게도 써요」 데모 — 배운 표현 하나(give it a shot)가 상황마다 어떻게 쓰이는지 예문 카드가 옆으로 한 장씩 넘어간다.
// 실제 추가 예문 화면 구성(그림·질문·예문·해석, 아래 점) 그대로다
import Image from 'next/image';

import { USAGE_EXPRESSION } from '../_model/paywall-content';
import { DemoScreen, type DemoProps } from './DemoScreen';

/** 카드 폭 + 간격 — 한 장 넘길 때 움직이는 거리 */
const CARD = 300;
const GAP = 14;

export const UsageDemo = ({ step, width }: DemoProps) => (
  <DemoScreen width={width}>
    <p className="flex items-center px-5 pt-5 text-foreground">
      <span className="w-6 text-2xl">‹</span>
      <span className="flex-1 text-center text-lg font-bold">
        {USAGE_EXPRESSION.meaning}
      </span>
      <span className="w-6" />
    </p>
    <p className="px-6 pt-6 text-[22px] font-bold text-foreground">
      이렇게도 써요
    </p>

    <div className="mt-4 overflow-hidden">
      <div
        // 지금 카드가 가운데에 서고 양옆 카드가 살짝 보인다
        className="flex transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{
          gap: GAP,
          paddingLeft: `calc(50% - ${CARD / 2}px)`,
          transform: `translateX(${-step * (CARD + GAP)}px)`,
        }}
      >
        {USAGE_EXPRESSION.examples.map((example) => (
          <div
            key={example.image}
            className="shrink-0 overflow-hidden rounded-3xl border border-[#ebebe8] bg-card"
            style={{ width: CARD }}
          >
            <div className="relative h-[260px]">
              <Image
                src={example.image}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-2 px-5 py-4">
              <p className="text-[17px] leading-snug font-bold text-foreground">
                <span className="mr-2 text-sm text-muted-foreground">Q</span>
                {example.question}
              </p>
              <p className="text-[17px] leading-snug font-bold text-foreground">
                <span className="mr-2 text-sm text-muted-foreground">A</span>
                {example.sentence[0]}
                <span className="text-primary">{example.sentence[1]}</span>
                {example.sentence[2]}
              </p>
              <p className="text-sm text-muted-foreground">
                {example.translation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-4 flex justify-center gap-1.5">
      {USAGE_EXPRESSION.examples.map((example, index) => (
        <span
          key={example.image}
          className={`h-2 rounded-full transition-all duration-500 ${index === step ? 'w-6 bg-primary' : 'w-2 bg-[#dcdad5]'}`}
        />
      ))}
    </div>
  </DemoScreen>
);
