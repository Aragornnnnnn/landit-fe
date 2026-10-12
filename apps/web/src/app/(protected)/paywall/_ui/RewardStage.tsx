'use client';

// 환급 무대의 본문(PaywallHero의 어두운 무대 안) — 금색 「100일 환급 챌린지」가 주인공이다.
// 무대 위로 지폐·돈주머니가 3D로 돌며 계속 떨어진다.
// 그 아래 「영어 공부했더니 통장에 돈이 들어와요」 — 규칙 두 줄과, 폰 안에 그대로 옮긴 실제 환급 화면(쌓인 환급액·통장 내역·환급 신청 버튼).
// 히어로(data-inview가 처음부터 켜진 섹션) 안에 놓여 마운트하자마자 연출된다. 애니메이션이 안 돌아도 문구는 그대로 보인다
import type { CSSProperties } from 'react';

import { Emoji } from '@/shared/ui/emoji';

import type { RewardPlan } from '../_model/paywall-content';
import { getRewardSteps, getRewardTickers } from '../_model/paywall-copy';
import { RewardPhoneDemo } from './RewardPhoneDemo';
import { Text3D } from './Text3D';
import { Ticker } from './Ticker';

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

/** 무대 아래쪽에 드문드문 떨어지는 돈 — 세로 자리(%)·가로 자리(%)·크기·한 번 떨어지는 시간·시작 시점 */
const LOWER_RAIN = [
  { emoji: '💵', top: 38, x: 3, size: 22, duration: 5.2, delay: -0.8 },
  { emoji: '💸', top: 44, x: 90, size: 24, duration: 6.1, delay: -3.2 },
  { emoji: '💰', top: 54, x: 1, size: 20, duration: 5.6, delay: -2.1 },
  { emoji: '💵', top: 60, x: 93, size: 22, duration: 6.4, delay: -4.6 },
  { emoji: '💸', top: 70, x: 4, size: 22, duration: 5.9, delay: -1.5 },
  { emoji: '💵', top: 76, x: 91, size: 20, duration: 5.4, delay: -3.8 },
  { emoji: '💰', top: 84, x: 6, size: 20, duration: 6.2, delay: -0.3 },
  { emoji: '💸', top: 88, x: 88, size: 22, duration: 5.7, delay: -2.7 },
];

/**
 * 환급 안내 — 무대 위에 제목과 규칙 두 줄을 적고, 그 아래 폰 안에서 실제 환급 화면이 반복해 흐른다(RewardPhoneDemo).
 * 잘못 알고 결제했다는 말이 없게 규칙을 결제 전에 말한다
 */
const ChallengeGuide = ({ plan }: { plan: RewardPlan }) => (
  <div
    className="animate-reveal-up relative mx-5 mt-8 text-left"
    style={{ '--i': 4 } as CSSProperties}
  >
    <h2 className="text-center text-[26px] leading-[34px] font-black tracking-[-0.025em] text-white">
      영어 공부했더니
      <br />
      <span className="text-[#f7cf5c]">통장에 돈이 들어와요</span>
    </h2>
    <ul className="mx-auto mt-3 flex w-fit flex-col gap-2">
      {getRewardSteps(plan).map(([emoji, text]) => (
        <li
          key={text}
          className="flex items-start gap-2 text-[14px] leading-[22px] font-medium break-keep text-white/80"
        >
          <Emoji className="mt-0.5 size-[18px] shrink-0">{emoji}</Emoji>
          {text}
        </li>
      ))}
    </ul>
    <RewardPhoneDemo plan={plan} />
  </div>
);

export const RewardStage = ({
  plan,
}: {
  /** 환급 플랜 — 하루 적립액과 다 모았을 때 금액을 여기서 읽는다 */
  plan: RewardPlan;
}) => {
  const tickers = getRewardTickers(plan);

  return (
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
        {/* 아래쪽 어두운 자리에도 드문드문 흐리게 계속 떨어진다 — 폰과 글자를 가리지 않게 가장자리로 */}
        {LOWER_RAIN.map((coin, index) => (
          <span
            key={index}
            className="absolute opacity-35"
            style={{ top: `${coin.top}%`, left: `${coin.x}%` }}
          >
            <span
              className="reveal-money-rain block opacity-0"
              style={
                {
                  fontSize: coin.size,
                  '--duration': `${coin.duration}s`,
                  '--delay': `${coin.delay}s`,
                } as CSSProperties
              }
            >
              <Emoji>{coin.emoji}</Emoji>
            </span>
          </span>
        ))}
      </div>

      {/* 아래쪽 금빛 — 스포트라이트가 닿지 않는 폰 뒤에서 은은하게 숨 쉬듯 번진다 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[40px] left-1/2 h-[640px] w-[480px] -translate-x-1/2 animate-pulse rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,206,84,0.26),rgba(255,206,84,0.08)_60%,transparent)] [animation-duration:5s]"
      />

      <div className="relative z-10 mt-4">
        <Ticker text={tickers.top} />
      </div>

      {/* 제목은 두 띠 사이 한가운데에 선다 — 위아래 간격을 같게 둔다 */}
      <div className="h-11" />

      {/* 메인 — 금색 「100일 환급 챌린지」 */}
      <h1 className="relative px-6 text-center font-black tracking-[-0.03em] text-white">
        <span
          className="animate-reveal-up block text-[54px] leading-[62px] tracking-[-0.04em]"
          style={{ '--i': 2 } as CSSProperties}
        >
          <Text3D>{plan.days}일</Text3D>
          <br />
          <Text3D>환급 챌린지</Text3D>
        </span>
      </h1>

      <div className="relative z-10 mt-11">
        <Ticker text={tickers.bottom} reverse />
      </div>

      <ChallengeGuide plan={plan} />
    </div>
  );
};
