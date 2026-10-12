'use client';

// 폰 속 환급 화면 데모 — 실제 환급 화면에서 헤더만 뺀 모습으로, 챌린지 마지막 며칠이 반복해 흐른다.
// 오늘의 시나리오 내역이 위로 한 줄씩 쌓이며 쌓인 환급액이 오르고 → 다 모으면 금액이 커지고 흐리던 환급 신청 버튼의 색이 켜지고 → 입금 알림이 내려온다.
// 폰 속은 그림이라 눌리지 않고 읽어 주지도 않는다
import { useState } from 'react';
import Image from 'next/image';

import potComplete from '@/features/reward/assets/reward-pot-complete.webp';
import { KST_OFFSET_MS } from '@/features/reward/model/time-left';
import { RewardHistory } from '@/features/reward/ui/RewardHistory';
import { formatWon } from '@/features/subscription/lib/won';
import { useInView } from '@/shared/lib/useInView';
import { Button } from '@/shared/ui/Button';

import tossAppIcon from '../_assets/toss-app-icon.webp';
import { prefersReducedMotion } from '../_lib/reduced-motion';
import { useLoopClock } from '../_lib/useLoopClock';
import type { RewardPlan } from '../_model/paywall-content';
import { PhoneFrame } from './PhoneFrame';

/** 폰 속 화면을 그리는 폭 — 실제 화면(375px)을 그대로 그리고 폰 크기에 맞춰 줄인다 */
const SCREEN_WIDTH = 375;
const PHONE_WIDTH = 286;

/** 쌓이는 내역 줄 수 — 마지막 줄에서 결제 금액을 다 모은다 */
const ROWS = 5;
const NOTE = ['21:40', '08:12', '19:05', '07:58', '22:14'];
/** 장면 — 내역이 한 줄씩(ROWS장), 버튼이 켜지고, 눌리고, 입금 알림 */
const SCENE = { button: ROWS, pressed: ROWS + 1, deposit: ROWS + 2 } as const;
const DURATIONS = [
  ...Array.from({ length: ROWS - 1 }, () => 420),
  700,
  450,
  420,
  3200,
];

const SPRING = 'ease-[cubic-bezier(0.34,1.56,0.64,1)]';

/** 통장 내역 — 오늘까지의 날짜로 적는다. 맨 위가 오늘(마지막 날)이다 */
const historyOf = ({ dailyRefund, maxRefund }: RewardPlan) =>
  Array.from({ length: ROWS }, (_, ago) => {
    const day = new Date(Date.now() + KST_OFFSET_MS - ago * 86_400_000);
    return {
      id: `sample-${ago}`,
      dateLabel: `${day.getUTCMonth() + 1}.${day.getUTCDate()}`,
      title: '오늘의 시나리오 완료',
      note: NOTE[ago],
      amountWon: dailyRefund,
      balanceWon: maxRefund - dailyRefund * ago,
    };
  });

export const RewardPhoneDemo = ({ plan }: { plan: RewardPlan }) => {
  // 화면을 떠나면 멈춘다 — 아래 플랜을 읽는 동안 보이지 않는 데모가 계속 다시 그려지지 않게
  const { ref, inView } = useInView<HTMLDivElement>(undefined, {
    once: false,
  });
  const clock = useLoopClock(DURATIONS, inView);
  // 동작 줄이기를 켠 기기는 다 모아 버튼이 켜진 장면에 세운다 — 멈춘 시계가 주는 마지막 장면(입금 알림)은 화면을 어둡게 덮는다
  const [reduced] = useState(prefersReducedMotion);
  // 화면 밖에서는 첫 장면으로 기다린다
  const step = reduced ? SCENE.button : inView ? clock.step : 0;
  const history = historyOf(plan);
  // 지금까지 쌓인 줄 수 — 버튼 장면부터는 다 쌓여 있다
  const shown = Math.min(step + 1, ROWS);
  const complete = shown === ROWS;

  return (
    <div ref={ref} className="relative">
      <PhoneFrame
        radius={34}
        // 폭은 화면 폭에 테두리 두께(1.5px × 2)를 더한 값
        className="pointer-events-none mx-auto mt-7 w-[289px]"
      >
        <div
          aria-hidden="true"
          data-demo-step={step}
          className="relative flex flex-col bg-background"
          style={{
            width: SCREEN_WIDTH,
            height: 650,
            zoom: PHONE_WIDTH / SCREEN_WIDTH,
          }}
        >
          <div className="flex flex-col items-center bg-linear-to-b from-[#ffc850]/25 to-transparent px-5 pt-8">
            <div className="h-[150px] w-[200px]">
              <Image
                src={potComplete}
                alt=""
                className="size-full object-contain"
              />
            </div>
            <p className="mt-2 text-[13px] font-bold text-primary">
              쌓인 환급액
            </p>
            <p
              className={`mt-0.5 text-[36px] leading-tight font-black tabular-nums transition-[scale,color] duration-500 ${SPRING} ${
                complete ? 'scale-125 text-primary' : 'text-foreground'
              }`}
            >
              {formatWon(history[ROWS - shown].balanceWon)}
            </p>
            {/* 다 모은 뒤에는 말을 붙이지 않는다 — 다 채워야만 돌려받는 것처럼 읽히지 않게. 자리는 지켜 아래가 움직이지 않는다 */}
            <p
              className={`mt-1.5 text-[14px] font-medium text-muted-foreground ${complete ? 'invisible' : ''}`}
            >
              오늘 {formatWon(plan.dailyRefund)}을 받았어요
            </p>
          </div>
          {/* 새 줄이 위에서 펼쳐지며 앞선 줄을 아래로 민다 */}
          <div className="min-h-0 flex-1 overflow-hidden px-5">
            {history.map((row, ago) => {
              const visible = ago >= ROWS - shown;
              return (
                <div
                  key={row.id}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    visible
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <RewardHistory history={[row]} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border px-5 pt-3 pb-5">
            {/* 쌓는 동안에는 남은 날짜를 말하는 흐린 버튼, 다 모으면 색만 켜진다. 입체 테두리가 튀어나오지 않게 납작한 모습으로 둔다.
                눌리는 장면에서는 버튼이 살짝 줄며 어두워지고, 누른 자리에서 동그란 물결이 번진다 */}
            <div
              className={`relative transition-[scale,filter] duration-150 ${
                step === SCENE.pressed ? 'scale-[0.94] brightness-85' : ''
              }`}
            >
              <Button
                tabIndex={-1}
                disabled={step < SCENE.button}
                className="shadow-none!"
              >
                {step >= SCENE.button
                  ? '환급 신청하기'
                  : complete
                    ? '곧 환급 신청할 수 있어요'
                    : `${ROWS - shown}일 뒤 환급 신청할 수 있어요`}
              </Button>
              {/* 평소엔 작고 반투명한 채 숨어 있다가, 눌리는 순간 드러나 커지며 사라진다 */}
              <span
                className={`absolute top-1/2 left-1/2 -mt-7 -ml-7 size-14 rounded-full bg-white ${
                  step === SCENE.pressed
                    ? 'scale-[2.6] opacity-0 transition-[scale,opacity] duration-400 ease-out'
                    : 'invisible scale-50 opacity-60'
                }`}
              />
            </div>
          </div>

          {/* 입금 알림이 이 데모의 핵심이다 — 화면이 어두워지고 알림만 밝게 튀어나온다 */}
          <div
            className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${
              step === SCENE.deposit ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </PhoneFrame>
      {/* 입금 알림 — 폰보다 넓게, 폰을 뚫고 나오듯 작게 시작해 크게 튀어나온다 */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-[150px] left-1/2 z-10 -ml-[168px] flex w-[336px] items-center gap-3 rounded-[26px] bg-white py-4 pr-5 pl-4 shadow-[0_22px_50px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.04)] ${
          step === SCENE.deposit
            ? `scale-100 -rotate-2 opacity-100 transition-[scale,opacity,rotate] duration-500 ${SPRING}`
            : 'scale-[0.35] opacity-0'
        }`}
      >
        {/* 토스 앱 아이콘 — 브랜드 리소스 센터의 원본을 변형 없이, 흰 배경과 여백 그대로 쓴다 */}
        <Image
          src={tossAppIcon}
          alt=""
          className="size-[56px] shrink-0 rounded-[14px] border border-border"
        />
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[22px] leading-tight font-black text-foreground">
              {formatWon(plan.maxRefund)} 입금
            </p>
            <span className="shrink-0 text-[13px] text-muted-foreground">
              지금
            </span>
          </div>
          <p className="mt-1 text-[15px] font-medium text-muted-foreground">
            랜딧 → 내 계좌
          </p>
        </div>
      </div>
    </div>
  );
};
