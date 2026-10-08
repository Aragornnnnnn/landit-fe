'use client';

// 발음 평가 데모 — 폰 화면 속 실제 발음 피드백 화면. 장면은 카드가 정해 넘긴다.
// 듣는 중 → 점수 게이지가 차오름 → 단어마다 판정 → 틀린 음절을 짚는 카드.
// 멈춰 있으면(관찰 전·동작 줄이기) 마지막 장면이라 연출이 안 돌아도 완성된 화면이 보인다
import type { CSSProperties } from 'react';

import { useCountUp } from '../_lib/useCountUp';
import { DemoScreen, type DemoProps } from './DemoScreen';

const PRONUNCIATION_SCENE = {
  listening: 0,
  scoring: 1,
  words: 2,
  detail: 3,
} as const;

const SCORE = 63;
/** 게이지 호 — 아래가 열린 220° 원호. pathLength를 100으로 둬 점수를 그대로 길이로 쓴다 */
const ARC = 'M23.7 168.5 A110 110 0 1 1 236.3 168.5';

const WORDS: { text: string; ok: boolean }[] = [
  { text: 'Honestly', ok: false },
  { text: "I'm", ok: true },
  { text: 'always', ok: true },
  { text: 'up', ok: true },
  { text: 'for', ok: false },
  { text: 'exploring', ok: true },
  { text: 'the', ok: true },
  { text: 'city', ok: false },
];

const Listening = () => (
  <div className="flex flex-col items-center gap-3">
    <div className="flex h-12 items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="animate-wave-bar h-12 w-2 rounded-full bg-[#f5bf3c]"
          style={{ '--i': i } as CSSProperties}
        />
      ))}
    </div>
    <p className="text-lg font-bold text-muted-foreground">듣고 있어요</p>
  </div>
);

const Score = ({ counting }: { counting: boolean }) => {
  const shown = useCountUp(SCORE, counting, 1100);
  return (
    <p className="text-[64px] leading-none font-bold tracking-[-0.03em] text-foreground tabular-nums">
      {shown}
      <span className="text-[36px]">%</span>
    </p>
  );
};

const Gauge = ({ step }: { step: number }) => {
  const filled = step >= PRONUNCIATION_SCENE.scoring;
  return (
    <div className="relative mx-auto h-[200px] w-[260px]">
      <svg
        viewBox="0 0 260 200"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          stroke="#f0f0ee"
          strokeWidth={22}
          strokeLinecap="round"
        />
        <path
          d={ARC}
          pathLength={100}
          fill="none"
          stroke="#f5bf3c"
          strokeWidth={22}
          strokeLinecap="round"
          strokeDasharray="100 100"
          // 다시 비울 때는 순식간에, 채울 때만 천천히 — 바퀴가 돌 때 거꾸로 줄어드는 게 보이지 않게
          className={
            filled
              ? 'transition-[stroke-dashoffset] duration-[1100ms] ease-out'
              : ''
          }
          style={{ strokeDashoffset: filled ? 100 - SCORE : 100 }}
        />
      </svg>
      <div className="absolute inset-x-0 top-[78px] flex flex-col items-center">
        {step === PRONUNCIATION_SCENE.listening ? (
          <Listening />
        ) : (
          <Score counting={filled} />
        )}
        <span
          // 게이지가 다 찬 뒤에 통통 튀며 붙는다. 다음 바퀴로 넘어갈 땐 바로 사라진다
          className={`mt-2 rounded-full bg-[#f5bf3c] px-4 py-1.5 text-lg font-bold text-white ${
            filled
              ? 'scale-100 opacity-100 transition-[opacity,scale] delay-[1000ms] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
              : 'scale-50 opacity-0'
          }`}
        >
          Good!
        </span>
      </div>
      <span className="absolute bottom-0 left-4 text-sm text-muted-foreground">
        0
      </span>
      <span className="absolute right-2 bottom-0 text-sm text-muted-foreground">
        100
      </span>
    </div>
  );
};

const WordChips = ({ step }: { step: number }) => {
  const judged = step >= PRONUNCIATION_SCENE.words;
  return (
    <ul className="mx-auto mt-5 flex w-[340px] flex-wrap justify-center gap-2.5">
      {WORDS.map((word, index) => {
        const tone = !judged
          ? 'border-transparent bg-[#f0f0ee] text-[#c4c4c0]'
          : word.ok
            ? 'border-transparent bg-[#f0f0ee] text-[#3f7d55]'
            : 'border-[#e5e5e0] bg-card text-[#e5534b] shadow-[0_3px_0_#e5e5e0]';
        // 판정이 왼쪽부터 차례로 켜진다. 되돌릴 땐 한꺼번에
        const delay = judged ? index * 110 : 0;
        return (
          <li
            key={word.text}
            className={`rounded-2xl border-[1.5px] px-4 py-2.5 text-xl font-bold transition-colors duration-300 ${tone} ${
              step === PRONUNCIATION_SCENE.detail && index === 0
                ? 'animate-ring-pulse'
                : ''
            }`}
            style={{ transitionDelay: `${delay}ms` }}
          >
            {word.text}
          </li>
        );
      })}
    </ul>
  );
};

/** 틀린 음절 카드 — 아래에서 올라와 원어민과 내 발음을 음절로 맞대고, 틀린 't'가 흔들린다 */
const DetailCard = ({ step }: { step: number }) => {
  const shown = step === PRONUNCIATION_SCENE.detail;
  return (
    <div
      className={`absolute inset-x-5 top-[340px] rounded-3xl border border-[#ebebe8] bg-card px-6 py-5 shadow-[0_-6px_24px_rgba(51,38,26,0.12)] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
      }`}
    >
      <p className="text-[26px] font-bold text-foreground">Honestly</p>
      <p className="mt-3 flex items-baseline gap-5">
        <span className="w-14 text-lg text-muted-foreground">원어민</span>
        <span className="text-[32px] font-bold text-[#3f7d55]">
          ah·nihs
          <span className="underline decoration-2 underline-offset-4">t</span>
          ·lee
        </span>
      </p>
      <p className="mt-1.5 flex items-baseline gap-5">
        <span className="w-14 text-lg text-muted-foreground">나</span>
        <span className="text-[32px] font-bold text-[#3f7d55]">
          o·nes·
          <span
            className={`inline-block text-[#e5534b] underline decoration-2 underline-offset-4 ${shown ? 'animate-shake' : ''}`}
            style={{ animationDelay: '600ms' }}
          >
            t
          </span>
          ·lee
        </span>
      </p>
    </div>
  );
};

export const PronunciationDemo = ({ step, width }: DemoProps) => {
  return (
    <DemoScreen width={width}>
      <div className="flex items-center px-5 py-4">
        <span className="w-6 text-2xl text-foreground">‹</span>
        <p className="flex-1 text-center text-lg font-bold text-foreground">
          래디의 발음 피드백
        </p>
        <span className="w-6" />
      </div>

      <Gauge step={step} />
      <WordChips step={step} />
      <DetailCard step={step} />
    </DemoScreen>
  );
};
