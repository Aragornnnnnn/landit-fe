'use client';

// 첫 퀴즈 데모 — 클로이가 질문하고(입이 움직인다), 단어 칩이 하나씩 답 줄로 옮겨 가고, 정답 시트가 올라오며 클로이가 웃는다
import type { CSSProperties } from 'react';

import { PartnerCharacter } from '@/features/conversation/ui/character/PartnerCharacter';
import { QUIZ_VIEWBOX } from '@/features/expression/model/quiz-partner';

import { DemoScreen, type DemoProps } from './DemoScreen';

const QUIZ_SCENE = { ask: 0, build: 1, correct: 2 } as const;
const ANSWER = [
  'Honestly',
  "I'm",
  'always',
  'up',
  'for',
  'exploring',
  'the',
  'city',
];
/** 보기 칸 — 답 단어를 섞고 함정 단어를 끼웠다 */
const BANK = [
  'city',
  'always',
  'explore',
  'Honestly',
  'for',
  'to',
  "I'm",
  'the',
  'was',
  'up',
  'exploring',
];
/** 칩이 한 장씩 옮겨 가는 간격(ms) */
const CHIP_GAP = 240;

const CHIP =
  'rounded-2xl border-[1.5px] border-[#e5e5e0] bg-card px-4 py-2.5 text-[19px] font-semibold text-foreground shadow-[0_3px_0_#e5e5e0]';

export const QuizDemo = ({ step, width }: DemoProps) => {
  const building = step >= QUIZ_SCENE.build;
  const correct = step === QUIZ_SCENE.correct;

  return (
    <DemoScreen width={width}>
      <p className="px-5 pt-7 text-[22px] font-bold text-foreground">
        질문에 대한 대답을 완성하세요
      </p>

      <div className="mt-5 flex items-center gap-3 px-5">
        <div className="h-[110px] w-[92px] shrink-0">
          <PartnerCharacter
            partner="chloe"
            look={{
              posture: step === QUIZ_SCENE.ask ? 'speaking' : 'listening',
              expression: correct ? 'happy' : 'neutral',
            }}
            speech={null}
            viewBox={QUIZ_VIEWBOX.chloe}
          />
        </div>
        <div className="flex-1 rounded-3xl bg-[#f0f0ee] px-5 py-4">
          <p className="text-[17px] leading-snug font-bold text-foreground">
            Are you more of a go-explore person or a stay-in person?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            넌 도시 탐험파야, 집콕파야?
          </p>
        </div>
      </div>
      <p className="mt-4 mr-5 ml-auto w-fit max-w-[290px] rounded-3xl rounded-tr-md bg-primary px-5 py-3.5 text-[17px] font-bold text-primary-foreground">
        솔직히 난 도시 탐험이라면 언제든 콜이야.
      </p>

      {/* 답 줄 — 칩이 왼쪽부터 차례로 들어앉는다 */}
      <div className="mx-5 mt-6 flex min-h-[124px] flex-wrap content-start gap-2.5 border-b-2 border-[#e5e5e0] pb-3">
        {ANSWER.map((word, index) => (
          <span
            key={word}
            // 들어올 때만 통통 튀며, 다음 바퀴로 돌아갈 땐 한 번에 비운다
            className={`${CHIP} ${
              building
                ? 'translate-y-0 scale-100 opacity-100 transition-[opacity,translate,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
                : 'translate-y-16 scale-75 opacity-0'
            }`}
            style={{
              transitionDelay: building ? `${index * CHIP_GAP}ms` : '0ms',
            }}
          >
            {word}
          </span>
        ))}
      </div>

      {/* 보기 칸 — 답으로 옮겨 간 칩 자리는 빈 칸만 남는다 */}
      <div className="mx-5 mt-6 flex flex-wrap justify-center gap-2.5">
        {BANK.map((word) => {
          const order = ANSWER.indexOf(word);
          const taken = building && order >= 0;
          return (
            <span key={word} className="relative">
              <span className={`${CHIP} invisible block`}>{word}</span>
              <span className="absolute inset-0 rounded-2xl bg-[#f0f0ee]" />
              <span
                className={`${CHIP} absolute inset-0 transition-[opacity,scale] duration-200 ${taken ? 'scale-90 opacity-0' : 'opacity-100'}`}
                style={{
                  transitionDelay: taken ? `${order * CHIP_GAP}ms` : '0ms',
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </div>

      {/* 정답 시트 */}
      <div
        className={`absolute inset-x-0 top-[440px] bottom-0 rounded-t-[28px] bg-[#e6f1ea] px-5 pt-6 pb-10 transition-[translate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          correct ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <p className="flex items-center gap-2.5 text-[22px] font-bold text-[#2e7d4f]">
          <span
            className={`flex size-8 items-center justify-center rounded-full bg-[#2e7d4f] text-lg text-white ${correct ? 'animate-pop' : ''}`}
            style={{ animationDelay: '350ms' } as CSSProperties}
          >
            ✓
          </span>
          정답이에요!
        </p>
        <p className="mt-4 text-sm font-bold text-[#2e7d4f]">정답</p>
        <p className="mt-1 text-[19px] font-bold text-foreground">
          Honestly, I&apos;m always up for exploring the city.
        </p>
        <p className="mt-5 rounded-2xl bg-[#2e7d4f] py-4 text-center text-base font-bold text-white shadow-[0_4px_0_#1f5c39]">
          표현 배우러 갈게요
        </p>
      </div>
    </DemoScreen>
  );
};
