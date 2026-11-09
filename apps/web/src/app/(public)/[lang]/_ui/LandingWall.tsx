'use client';

// 시나리오 벽 — 비스듬히 깔린 카드 속에 오늘의 시나리오 한 장이 놓인다. 스크롤하면 줄이 엇갈려 움직이고, 벽이 화면 가운데로 오면 나머지가 어두워지며 오늘의 카드가 커진다. 카드 배치는 들어올 때마다 섞이고, 오늘의 카드는 재밌는 주제 중에서 무작위로 뽑힌다
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';

import { useInView } from '@/shared/lib/useInView';

import { buildWall, wallFocus } from '../_model/scenario-wall';

const ROW_COUNT = 4;
const PER_ROW = 24;
/** 서버와 첫 화면은 같은 벽으로 그린다 — 고정 난수로 짠다 */
const SERVER_WALL = buildWall(ROW_COUNT, PER_ROW, () => 0);
/** 브라우저에선 페이지를 열 때 벽을 무작위로 한 번만 새로 짠다 — 그림은 벽에 가까워질 때 받으므로 바뀌는 게 보이지 않는다 */
let randomWall: typeof SERVER_WALL | null = null;
const getRandomWall = () =>
  (randomWall ??= buildWall(ROW_COUNT, PER_ROW, Math.random));
const subscribeNever = () => () => {};
/** 화면을 다 지나는 동안 줄이 움직이는 거리(px) */
const TRAVEL = 560;
/** 벽이 화면 아래 이만큼 앞에 왔을 때 그림을 받기 시작한다 */
const NEAR_MARGIN = '0px 0px 100px 0px';

const Card = ({
  title,
  image,
  picked = false,
  near,
}: {
  title: string;
  image: string;
  picked?: boolean;
  near: boolean;
}) => (
  <div
    className={`relative shrink-0 overflow-hidden rounded-[14px] bg-[#e9e4dc] ${picked ? 'h-[288px] w-[192px] border-4 border-primary shadow-[0_0_0_6px_rgba(224,122,58,0.25),0_18px_40px_rgba(224,122,58,0.45)] sm:h-[360px] sm:w-[240px]' : 'h-[180px] w-[120px] drop-shadow-[0_6px_7px_rgba(51,31,13,0.18)] sm:h-[234px] sm:w-[156px]'}`}
  >
    {near && (
      <Image
        src={image}
        alt=""
        width={240}
        height={360}
        unoptimized
        loading="eager"
        className="absolute inset-0 size-full object-cover"
      />
    )}
    {title && (
      <>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.72))]" />
        <p
          className={`absolute inset-x-2.5 bottom-2.5 line-clamp-2 font-bold break-keep text-white ${picked ? 'text-[17px] leading-[1.3] sm:text-[19px]' : 'text-[13px] leading-[1.3]'}`}
        >
          {title}
        </p>
      </>
    )}
  </div>
);

/** 오늘의 카드 딱지 문구는 서버가 넘긴다 — landing 문구 묶음 전체를 브라우저로 보내지 않기 위해서다 */
export const LandingWall = ({ todayLabel }: { todayLabel: string }) => {
  const locale = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  // 그림은 벽에 가까워질 때 받는다 — 첫 화면 표시가 그림 100장을 기다리지 않게 한다
  const { ref: nearRef, inView: near } = useInView<HTMLDivElement>(NEAR_MARGIN);
  const wall = useSyncExternalStore(
    subscribeNever,
    getRandomWall,
    () => SERVER_WALL,
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    // 움직임을 줄인 사람에겐 처음부터 오늘의 카드를 띄워 둔다
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stage.style.setProperty('--wall-focus', '1');
      return;
    }
    const update = () => {
      const { top, height } = stage.getBoundingClientRect();
      const progress =
        (window.innerHeight - top) / (window.innerHeight + height);
      stage.style.setProperty('--wall-shift', `${(progress - 0.5) * TRAVEL}px`);
      stage.style.setProperty('--wall-focus', `${wallFocus(progress)}`);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div ref={nearRef}>
      <div
        ref={stageRef}
        aria-hidden="true"
        className="relative h-[540px] overflow-hidden [--wall-focus:0] [--wall-shift:0px] sm:h-[660px] lg:h-[720px]"
      >
        {/* 카드와 오늘의 시나리오가 한 묶음으로 기운다 — 같은 평면에 놓여야 벽 안에 녹아든다 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-7">
          <div className="flex flex-col items-center gap-3">
            {wall.rows.map((row, index) => (
              <div
                key={index}
                className="flex w-max gap-3 will-change-transform"
                style={{
                  transform: `translateX(calc(var(--wall-shift) * ${index % 2 ? -1 : 1} + ${index % 2 ? 40 : -24}px))`,
                }}
              >
                {row.map((scenario, column) => (
                  <Card
                    key={column}
                    title={scenario.title[locale] ?? ''}
                    image={scenario.image}
                    near={near}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* 오늘의 카드만 남기고 벽을 어둡게 — 스크롤한 만큼 짙어진다 */}
          <div
            className="pointer-events-none absolute -inset-[40%] bg-[#1d1308]"
            style={{ opacity: 'calc(var(--wall-focus) * 0.62)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 z-10 origin-center"
            style={{
              transform:
                'translate(-50%, -50%) scale(calc(1 + var(--wall-focus) * 0.1))',
            }}
          >
            <span className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#dc7839] px-4 py-1.5 text-[19px] font-bold whitespace-nowrap text-white shadow-[0_6px_14px_rgba(224,122,58,0.4)]">
              {todayLabel}
            </span>
            <Card
              title={wall.today.title[locale] ?? ''}
              image={wall.today.image}
              picked
              near={near}
            />
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(to_bottom,#f5f5f3,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_top,#f5f5f3,transparent)]" />
      </div>
    </div>
  );
};
