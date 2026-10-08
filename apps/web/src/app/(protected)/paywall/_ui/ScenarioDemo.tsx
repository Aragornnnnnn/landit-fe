'use client';

// 오늘의 시나리오 데모 — 화면을 꽉 채운 시나리오 카드 99장 중 한 장이 뽑혀 빛나고, 그 자리에서 커지며 오늘의 시나리오로 놓인 뒤 대화가 시작된다(마르코가 말을 건다)
import type { CSSProperties } from 'react';
import Image from 'next/image';

import { PartnerCharacter } from '@/features/conversation/ui/character/PartnerCharacter';
import { QUIZ_VIEWBOX } from '@/features/expression/model/quiz-partner';

import { SCENARIOS } from '../_model/paywall-content';
import { DemoScreen, DemoSlide, type DemoProps } from './DemoScreen';

const SCENARIO_SCENE = { grid: 0, pick: 1, picked: 2, talk: 3 } as const;
/** 카드 더미를 보여 주고, 한 장이 뽑혀 빛난 뒤, 그 한 장이 커져 놓이고, 대화로 넘어간다 */
export const SCENARIO_DURATIONS = [900, 900, 1600, 3600] as const;

/** 9열 × 11행 = 99장. 한가운데 한 장(49번)이 뽑힌다 */
const COLUMNS = 9;
const ROWS = 11;
const TILE_WIDTH = 28;
const TILE_HEIGHT = 40;
const GAP = 5;
const TILE_COUNT = COLUMNS * ROWS;
const PICKED_TILE = (TILE_COUNT - 1) / 2;
/** 뽑히는 시나리오(입주 첫날 첫 만남) */
const PICKED_INDEX = SCENARIOS.length - 2;
const PICKED = SCENARIOS[PICKED_INDEX];
/** 칸마다 그림을 흩뜨리되, 가운데 칸엔 뽑히는 시나리오가 오게 한다 */
const tileImage = (index: number) =>
  index === PICKED_TILE
    ? PICKED.image
    : SCENARIOS[(index * 5) % SCENARIOS.length].image;

/** 뽑힌 시나리오의 첫 대화 — 상대가 말을 걸고, 내가 답한다 */
const CHAT = [
  { mine: false, text: "Hey! You must be my new roommate. I'm Marco." },
  { mine: true, text: 'Hi Marco! Nice to meet you.' },
];

export const ScenarioDemo = ({ step, width }: DemoProps) => {
  const picking = step >= SCENARIO_SCENE.pick;
  const picked = step === SCENARIO_SCENE.picked;

  return (
    <DemoScreen width={width}>
      <DemoSlide shown={step !== SCENARIO_SCENE.talk}>
        <p className="px-6 pt-6 text-[22px] font-bold text-foreground">
          오늘의 시나리오
        </p>
        <div className="relative mt-5 h-[490px] overflow-hidden">
          {/* 카드 더미 — 움직이지 않는다. 뽑히면 나머지가 흐려지고, 뽑힌 한 장이 커지면 다 같이 물러난다 */}
          <div
            className={`mx-auto grid transition-opacity duration-300 ${picked ? 'opacity-0' : 'opacity-100'}`}
            style={{
              width: COLUMNS * TILE_WIDTH + (COLUMNS - 1) * GAP,
              gridTemplateColumns: `repeat(${COLUMNS}, ${TILE_WIDTH}px)`,
              gridAutoRows: TILE_HEIGHT,
              gap: GAP,
            }}
          >
            {Array.from({ length: TILE_COUNT }, (_, index) => {
              const chosen = index === PICKED_TILE;
              return (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-md transition-[opacity,scale,box-shadow] duration-300 ${
                    picking
                      ? chosen
                        ? 'z-10 scale-150 shadow-[0_0_0_2px_var(--color-primary),0_6px_14px_rgba(51,38,26,0.3)]'
                        : 'opacity-25'
                      : ''
                  }`}
                >
                  <Image
                    src={tileImage(index)}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>

          {/* 뽑힌 칸 자리(한가운데)에서 그 한 장이 커져 놓인다 */}
          <div
            className={`absolute top-1/2 left-1/2 h-[435px] w-[290px] -translate-1/2 overflow-hidden rounded-3xl shadow-[0_12px_28px_rgba(51,38,26,0.2)] ${
              picked
                ? 'scale-100 opacity-100 transition-[scale,opacity] duration-500 ease-[cubic-bezier(0.2,1.2,0.4,1)]'
                : 'scale-[0.1] opacity-0'
            }`}
          >
            <Image
              src={PICKED.image}
              alt=""
              fill
              sizes="290px"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(0,0,0,0.7))] px-4 pt-10 pb-4">
              <p className="text-2xl leading-snug font-bold text-white">
                {PICKED.title}
              </p>
            </div>
          </div>
        </div>
        <p
          className={`mx-6 mt-2 rounded-2xl bg-primary py-4 text-center text-lg font-bold text-primary-foreground transition-opacity duration-300 ${picked ? 'opacity-100' : 'opacity-0'}`}
        >
          대화 시작
        </p>
      </DemoSlide>

      {/* 뽑힌 시나리오 대화 — 마르코가 말을 걸고(입이 움직인다) 내가 답한다 */}
      <DemoSlide shown={step === SCENARIO_SCENE.talk}>
        <p className="px-6 pt-6 text-lg font-bold text-foreground">
          {PICKED.title}
        </p>
        <div className="mx-6 mt-4 flex h-[270px] justify-center overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#fdf1e8,#f7e4d2)] pt-3">
          <PartnerCharacter
            partner="marco"
            look={{ posture: 'speaking', expression: 'happy' }}
            speech={null}
            viewBox={QUIZ_VIEWBOX.marco}
          />
        </div>
        <div className="flex flex-col gap-2.5 px-6 pt-4">
          {CHAT.map((line, index) => (
            <p
              key={line.text}
              className={`max-w-[300px] rounded-3xl px-5 py-3 text-[17px] font-bold ${
                line.mine
                  ? 'self-end rounded-tr-md bg-primary text-primary-foreground'
                  : 'self-start rounded-tl-md bg-[#f0f0ee] text-foreground'
              } ${step === SCENARIO_SCENE.talk ? 'animate-reveal-up' : ''}`}
              style={{ '--i': 2 + index * 10 } as CSSProperties}
            >
              {line.text}
            </p>
          ))}
        </div>
      </DemoSlide>
    </DemoScreen>
  );
};
