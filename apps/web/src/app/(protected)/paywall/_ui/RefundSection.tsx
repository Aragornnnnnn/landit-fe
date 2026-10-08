'use client';

// 페이월 맨 위 메인 — 「6개월 영어 공부하면 / 전액 환급」. 돈과 「전액 환급」 한 마디가 주인공이다.
// 흰 배경 위로 바로 돈이 쏟아진다 — 가운데 큰 돈주머니가 통통 튀다 팡 터지며 돈이 사방으로 3D로 돌며 튀고, 뒤로는 지폐·돈주머니가 계속 떨어진다.
// 세 줄 아래엔 「6개월 동안 꾸준히 하면」 평균 습득 표현·대화 시간 카드(숫자가 0부터 오른다), 그 아래 아이폰 알림처럼 입금 알림이 떨어지고 「전액 환급」 라벨과 받는 조건(매일 학습)이 붙는 카드가 있다.
// 히어로(data-inview가 처음부터 켜진 섹션) 안에 놓여 마운트하자마자 연출된다. 애니메이션이 안 돌아도 돈주머니·문구는 그대로 보인다
import type { CSSProperties } from 'react';

import { formatWon } from '@/features/subscription/model/plans';
import { Emoji } from '@/shared/ui/emoji';

import { useCountUp } from '../_lib/useCountUp';
import {
  AVERAGE_TALK_MINUTES,
  LEARNABLE_EXPRESSION_COUNT,
  OUTCOME_AS_OF,
  REFUND_CHALLENGE_PERIOD,
  REFUND_PLANS,
} from '../_model/paywall-content';
import { Text3D } from './Text3D';
import { Ticker } from './Ticker';

/** 무대 띠 문구 — 위는 성과, 아래는 환급 */
const A_TOP_TICKER = `${REFUND_CHALLENGE_PERIOD} 꾸준히 하면 전액 환급 ✦ 평균 표현 ${LEARNABLE_EXPRESSION_COUNT}개 ✦ 평균 대화 ${AVERAGE_TALK_MINUTES}분 ✦ `;
const A_BOTTOM_TICKER = '공부하면 돌려받는 영어 ✦ 결제 금액 그대로 환급 ✦ ';

/** 주머니가 터질 때 사방으로 튀는 돈 — 날아갈 방향(px)과 돌아가는 각도 */
const BURST = [
  { emoji: '💵', dx: -130, dy: -70, spin: -40 },
  { emoji: '💵', dx: -90, dy: -130, spin: 30 },
  { emoji: '💸', dx: -20, dy: -150, spin: 60 },
  { emoji: '💸', dx: 60, dy: -140, spin: -25 },
  { emoji: '💵', dx: 125, dy: -90, spin: 45 },
  { emoji: '💵', dx: 150, dy: -10, spin: -60 },
  { emoji: '💸', dx: -155, dy: 0, spin: 20 },
  { emoji: '💰', dx: 95, dy: -40, spin: -15 },
];

/** 화면 전체로 계속 쏟아지는 돈 — 가로 위치·크기·한 번 떨어지는 시간·시작 시점(음수면 이미 떨어지는 중) */
const RAIN = [
  { emoji: '💵', x: 4, size: 28, duration: 3.2, delay: -0.4 },
  { emoji: '💸', x: 16, size: 34, duration: 4.0, delay: -1.8 },
  { emoji: '💰', x: 28, size: 24, duration: 2.8, delay: -1.1 },
  { emoji: '💵', x: 42, size: 32, duration: 3.8, delay: -2.6 },
  { emoji: '💸', x: 55, size: 26, duration: 3.0, delay: -0.2 },
  { emoji: '💵', x: 67, size: 30, duration: 4.2, delay: -1.4 },
  { emoji: '💰', x: 79, size: 26, duration: 3.4, delay: -2.1 },
  { emoji: '💸', x: 90, size: 30, duration: 3.6, delay: -0.9 },
  { emoji: '💵', x: 10, size: 22, duration: 2.6, delay: -1.5 },
  { emoji: '💸', x: 48, size: 24, duration: 3.5, delay: -0.6 },
  { emoji: '💵', x: 73, size: 22, duration: 2.7, delay: -1.9 },
  { emoji: '💰', x: 35, size: 24, duration: 3.1, delay: -2.3 },
];

/** 평균 성과 한 칸 — 이름 아래 숫자가 0부터 올라간다 */
const Outcome = ({
  value,
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) => {
  const shown = useCountUp(value, true, 1400);
  return (
    <div className="flex-1">
      <p className="text-[15px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-primary">
        <span className="text-[38px] leading-none font-black tracking-[-0.03em] tabular-nums">
          {shown}
        </span>
        <span className="ml-1 text-lg font-bold">{unit}</span>
      </p>
    </div>
  );
};

/** 입금 알림 카드 — 다크 잠금화면 위로 아이폰 리퀴드 글래스 알림이 툭 떨어지고 빨간 「전액 환급」 라벨이 붙는다. 아래엔 받는 조건 */
const Deposit = () => (
  <div
    className="animate-reveal-up relative mx-5 mt-3 rounded-3xl border border-[#ebe7e1] bg-card p-4 pb-5 shadow-[0_6px_20px_rgba(51,38,26,0.08)]"
    style={{ '--i': 5 } as CSSProperties}
  >
    {/* 잠금화면 배경 — 다크 모드. 무지개빛을 어둡게 눌러 유리 알림 뒤로 은은히 비친다 */}
    <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(115deg,#3b3220_0%,#3a2630_45%,#2a2338_70%,#1f3330_100%)] px-3 py-6">
      <span
        aria-hidden="true"
        className="absolute -top-6 left-6 size-24 rounded-full bg-[#f2a35c]/40 blur-xl"
      />
      <span
        aria-hidden="true"
        className="absolute -right-4 -bottom-8 size-28 rounded-full bg-[#5fb39b]/40 blur-xl"
      />
      <div className="reveal-deposit relative flex items-center gap-3 rounded-[26px] border border-white/15 bg-white/10 py-3 pr-4 pl-3 text-left shadow-[0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150">
        {/* 은행 앱 아이콘 — 실제 은행·간편결제 브랜드처럼 보이지 않게 직접 그린 원화 표시 */}
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(150deg,#4f8cff,#1f5ce0)] text-[24px] font-black text-white">
          ₩
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[19px] leading-tight font-bold tracking-[-0.02em] text-white">
              입금 {formatWon(REFUND_PLANS.yearly.price)}
            </p>
            <span className="shrink-0 text-[13px] text-white/55">지금</span>
          </div>
          <p className="mt-0.5 truncate text-[15px] text-white/80">
            랜딧 → 내 계좌
          </p>
        </div>
      </div>
      <span className="reveal-refund-label absolute top-2 right-3 rotate-6 rounded-full bg-[#f04438] px-3 py-1 text-sm font-black text-white shadow-[0_6px_14px_rgba(240,68,56,0.35)]">
        전액 환급
      </span>
    </div>
    {/* 받는 조건 — 매일 공부하면 결제 금액을 그대로 돌려받는다 */}
    <p className="mt-4 text-center text-[15px] leading-[1.55] text-muted-foreground">
      {REFUND_CHALLENGE_PERIOD} 동안{' '}
      <b className="font-bold text-foreground">하루도 빠짐없이</b> 학습하면
      <br />
      결제한 금액을 그대로 돌려드려요
    </p>
  </div>
);

export const RefundSection = () => (
  <div className="relative [perspective:500px]">
    {/* 화면 전체로 쏟아지는 돈 — 글자 뒤로 지나간다 */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {RAIN.map((coin, index) => (
        <span
          key={index}
          className="reveal-money-rain absolute top-0 opacity-0 drop-shadow-[0_3px_4px_rgba(0,0,0,0.12)]"
          style={
            {
              left: `${coin.x}%`,
              fontSize: coin.size,
              '--duration': `${coin.duration}s`,
              '--delay': `${coin.delay}s`,
            } as CSSProperties
          }
        >
          <Emoji>{coin.emoji}</Emoji>
        </span>
      ))}
    </div>

    <div className="relative z-10 mt-4">
      <Ticker text={A_TOP_TICKER} />
    </div>

    {/* 가운데 큰 돈주머니 — 통통 튀다 팡 터지고, 터질 때마다 돈이 사방으로 튄다 */}
    <div className="relative h-[190px]">
      <div className="absolute top-[52px] left-1/2 -translate-x-1/2">
        {BURST.map((coin, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="reveal-money-burst absolute top-[30px] left-[30px] text-[30px] opacity-0"
            style={
              {
                '--dx': `${coin.dx}px`,
                '--dy': `${coin.dy}px`,
                '--spin': `${coin.spin}deg`,
              } as CSSProperties
            }
          >
            <Emoji>{coin.emoji}</Emoji>
          </span>
        ))}
        <span className="reveal-money-bag block text-[96px] leading-none drop-shadow-[0_10px_12px_rgba(0,0,0,0.16)]">
          <Emoji label="돈주머니">💰</Emoji>
        </span>
      </div>
    </div>

    {/* 메인 — 「전액 환급」 한 마디만 크게 박힌다 */}
    <h1 className="relative px-6 text-center font-black tracking-[-0.03em] text-white">
      <span
        className="animate-reveal-up block text-[22px] leading-[30px] text-white/85"
        style={{ '--i': 1 } as CSSProperties}
      >
        {REFUND_CHALLENGE_PERIOD} 영어 공부하면
      </span>
      <span
        className="animate-reveal-up mt-2 block text-[64px] leading-[72px] tracking-[-0.04em]"
        style={{ '--i': 2 } as CSSProperties}
      >
        <Text3D>전액 환급</Text3D>
      </span>
    </h1>

    <div className="relative z-10 mt-6">
      <Ticker text={A_BOTTOM_TICKER} reverse />
    </div>

    {/* 6개월 동안 꾸준히 했을 때 오는 것 — 평균 습득 표현과 대화 시간 */}
    <div
      className="animate-reveal-up relative mx-5 mt-6 rounded-3xl border border-[#ebe7e1] bg-card px-6 pt-5 pb-3.5 text-left shadow-[0_6px_20px_rgba(51,38,26,0.08)]"
      style={{ '--i': 4 } as CSSProperties}
    >
      <p className="text-[15px] font-bold text-[#c8641f]">
        {REFUND_CHALLENGE_PERIOD} 동안 꾸준히 하면
      </p>
      <div className="mt-3 flex">
        <Outcome
          value={LEARNABLE_EXPRESSION_COUNT}
          unit="개"
          label="평균 습득 표현"
        />
        <span aria-hidden="true" className="mx-5 w-px bg-[#ebe7e1]" />
        <Outcome
          value={AVERAGE_TALK_MINUTES}
          unit="분"
          label="평균 대화 시간"
        />
      </div>
      {/* 두 숫자가 무엇의 평균인지, 언제 기준인지 */}
      <p className="mt-1 text-right text-[11px] leading-none text-[#a89a8b]">
        * {REFUND_CHALLENGE_PERIOD} 꾸준히 학습한 유저 평균 · {OUTCOME_AS_OF}{' '}
        기준
      </p>
    </div>

    <Deposit />
  </div>
);
