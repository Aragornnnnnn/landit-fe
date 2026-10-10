'use client';

// 데이터 섹션의 예문 그림 더미 — 실제 예문 그림 타일이 한 줄로 촤르르륵 지나간다. 예문이 이만큼 많다는 걸 양으로 보여준다.
// 끝에는 한 장에 멈춰 그 장이 커지고 문장이 뜬다 — 많이 지나간 뒤 하나로 모여야 "그래서 뭐가 있는데"가 남지 않는다.
// 멈추면 그 장의 문장이 아래로 열린다(미리 자리를 비워 두지 않는다).
// 화면에 충분히 들어왔을 때 한 방향으로 한 번만 달려 멈추고, 그대로 둔다 — 처음으로 되돌아가 반복하면 뒤로 감기는 것처럼 보인다
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { useInView } from '@/shared/lib/useInView';

import { prefersReducedMotion } from '../_lib/reduced-motion';
import {
  EXAMPLE_CARDS,
  EXAMPLE_LANDING_GLOSS,
  EXAMPLE_LANDING_INDEX,
} from '../_model/paywall-content';

/** 지나가는 시간 */
const FLICK_MS = 1600;
/** 화면 아래 1/4을 잘라, 덱이 화면에 충분히 올라왔을 때 출발한다 */
const START_MARGIN = '0px 0px -25% 0px';
/** 타일 크기 + 간격 — 작게 잡아 한 화면에 여러 장이 지나가게 한다 */
const TILE = 84;
const TILE_HEIGHT = 108;
const GAP = 6;

/**
 * 예문 그림 36장을 두 바퀴 이어 붙인다 — 1.6초 동안 수십 장이 스쳐 가야 '많다'가 느껴진다.
 * 멈추는 장은 마지막 바퀴 안에 있어 뒤로도 몇 장이 남는다
 */
const REPEAT = 2;
/** 그림을 미리 받기 시작하는 거리 — 화면 한 장만큼 아래에서. 출발(-25%)까지 넉넉히 남아 느린 망에서도 빈칸이 스치지 않는다 */
const NEAR_MARGIN = '0px 0px 100% 0px';
const TILES = Array.from({ length: REPEAT }, () => EXAMPLE_CARDS).flat();
const LANDING_TILE =
  (REPEAT - 1) * EXAMPLE_CARDS.length + EXAMPLE_LANDING_INDEX;

export const ExampleDeck = () => {
  const { ref, inView: started } = useInView<HTMLDivElement>(START_MARGIN);
  // 빠르게 스쳐 갈 때 아직 안 받은 그림이 빈칸으로 번쩍이지 않게, 덱이 다가오면 그림을 한꺼번에 받아 둔다
  const { ref: nearRef, inView: near } = useInView<HTMLDivElement>(NEAR_MARGIN);
  // 동작 줄이기를 켠 기기에선 달리지 않고 처음부터 멈춘 모습이다
  const [reduced] = useState(prefersReducedMotion);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => setArrived(true), FLICK_MS);
    return () => clearTimeout(timer);
  }, [started]);

  const moved = started || reduced;
  const landed = arrived || reduced;
  const running = started && !arrived && !reduced;
  const landing = EXAMPLE_CARDS[EXAMPLE_LANDING_INDEX];
  const [before, after] = landing.sentence.split(landing.highlight);

  return (
    <div ref={ref} className="flex flex-col">
      {/* 양 끝을 흐리게 지워 타일이 끝없이 이어지는 것처럼 보이게 한다. 멈춘 타일이 커질 자리만큼 위아래를 비운다 */}
      <div
        ref={nearRef}
        aria-hidden="true"
        className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] py-5"
      >
        <div
          // 가장 빠를 때 살짝 번져 스쳐 가는 느낌을 준다
          className={`flex ${running ? 'animate-streak transition-transform ease-[cubic-bezier(0.05,0.9,0.1,1)]' : ''}`}
          style={{
            gap: GAP,
            transitionDuration: `${FLICK_MS}ms`,
            // 첫 장이 가운데에서 출발해, 멈출 장이 가운데에 와서 선다
            paddingLeft: `calc(50% - ${TILE / 2}px)`,
            transform: `translateX(${moved ? -LANDING_TILE * (TILE + GAP) : 0}px)`,
          }}
        >
          {TILES.map((example, index) => {
            const isLanding = index === LANDING_TILE;
            return (
              <div
                key={index}
                className={`relative shrink-0 overflow-hidden rounded-2xl bg-[#e9e4dc] shadow-[0_4px_12px_rgba(51,38,26,0.1)] transition-[scale,opacity] duration-500 ${
                  landed
                    ? isLanding
                      ? 'z-10 scale-[1.32] opacity-100'
                      : 'scale-95 opacity-40'
                    : 'scale-100 opacity-100'
                }`}
                style={{ width: TILE, height: TILE_HEIGHT }}
              >
                {near && (
                  <Image
                    src={example.image}
                    alt=""
                    fill
                    loading="eager"
                    sizes={`${TILE}px`}
                    className="object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 멈춘 장의 문장·해석·표현 뜻 — 멈추면 아래로 열린다. 그 전엔 높이 0이라 빈자리가 남지 않는다 */}
      <div
        aria-hidden={!landed}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ${
          landed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col items-center gap-1.5 px-6 pt-5 pb-2 text-center">
            <p className="text-[17px] leading-snug font-bold text-foreground">
              {before}
              <span className="text-primary">{landing.highlight}</span>
              {after}
            </p>
            <p className="text-sm text-muted-foreground">
              {EXAMPLE_LANDING_GLOSS.translation}
            </p>
            <p className="mt-1 rounded-full bg-[#fdf1e6] px-3 py-1 text-xs font-bold text-[#c8641f]">
              {landing.highlight} = {EXAMPLE_LANDING_GLOSS.meaning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
