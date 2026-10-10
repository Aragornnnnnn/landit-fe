'use client';

// 받은 동전이 화면 가운데에 크게 떴다가 헤더 알약으로 빨려 들어가는 연출 — 학습을 끝내고 홈에 돌아온 순간 한 번 돈다.
// 주변을 어둡게 눌러 동전과 알약만 남긴다. 큰 동전과 금액이 먼저 뜨고(무엇을 받았는지), 잔동전들이 줄지어 날아가(어디에 쌓이는지) 숫자가 오른다.
// 화면 어디를 눌러도 바로 끝난다 — 그 안내는 금액과 떨어진 구석에 작게 둔다
import { useEffect, useEffectEvent } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { formatWon } from '@/shared/lib/won';

import { Coin } from './Coin';
import { CountUpWon } from './CountUpWon';
import {
  REFUND_PILL_CLASS,
  REFUND_PILL_COIN,
  REFUND_PILL_COIN_CENTER_X,
  REFUND_PILL_GOLD,
} from './refund-pill';

// 큰 동전이 뜨고, 날아가기 시작하고, 첫 동전이 알약에 닿는 때(초)
const POP = 0.05;
const FLY = 0.8;
const LAND = FLY + 0.42;
// 숫자가 다 오르고(CountUpWon의 0.9초) 잠깐 머문 뒤 어둠이 걷히기까지
const TOTAL = LAND + 1.5;
// 잔동전 하나가 날아가는 시간과, 다음 동전이 따라 나서는 간격
const TRAIL_FLIGHT = 0.62;
const TRAIL_STAGGER = 0.06;

const SKIP_LABEL = '건너뛰기 ›';

const BIG = 120;
const SMALL = 28;
// 큰 동전이 튀어 오르기 전에 내려가 있는 높이
const POP_RISE = 30;
// 받은 금액 글자의 폭과, 큰 동전 아래로 떨어진 거리
const CAPTION_WIDTH = 260;
const AMOUNT_GAP = 16;
// 잔동전이 흩어져 나오는 자리(큰 동전 중심 기준)와 휘어지는 정도. 받은 금액이 클수록 앞에서부터 더 많이 쓴다
const TRAIL = [
  { dx: -46, dy: -18, bend: -70 },
  { dx: 38, dy: -30, bend: 60 },
  { dx: -14, dy: 34, bend: -40 },
  { dx: 52, dy: 20, bend: 80 },
  { dx: -58, dy: 26, bend: -90 },
  { dx: 10, dy: -44, bend: 30 },
  { dx: 28, dy: 46, bend: 50 },
  { dx: -30, dy: -48, bend: -55 },
  { dx: 62, dy: -8, bend: 95 },
  { dx: -66, dy: -6, bend: -100 },
  { dx: -4, dy: 56, bend: 20 },
  { dx: 44, dy: 52, bend: 70 },
];

// 잔동전 하나가 대신하는 금액과 최소 개수 — 대화 하나(약 110원)면 여섯 개, 하루를 다 채우면(약 330원) 열두 개
const WON_PER_COIN = 28;
const MIN_COINS = 4;
export const coinCountOf = (amountWon: number) =>
  Math.min(
    Math.max(Math.round(amountWon / WON_PER_COIN) + 2, MIN_COINS),
    TRAIL.length,
  );

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const CoinShower = ({
  pill,
  fromWon,
  toWon,
  onEnd,
}: {
  // 헤더 알약의 화면 자리 — 어둠 위에 같은 알약을 그려 그것만 밝게 남긴다
  pill: Box;
  fromWon: number;
  toWon: number;
  // 다 돌았거나 건너뛰었다
  onEnd: () => void;
}) => {
  // 부르는 쪽이 다시 그려져도 타이머를 다시 걸지 않는다 — 걷힌 어둠이 화면을 막은 채 남으면 안 된다
  const end = useEffectEvent(onEnd);
  useEffect(() => {
    const timer = setTimeout(end, TOTAL * 1000);
    return () => clearTimeout(timer);
  }, []);

  const from = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  // 동전이 빨려 들어갈 자리 — 알약 속 동전
  const to = {
    x: pill.left + REFUND_PILL_COIN_CENTER_X,
    y: pill.top + pill.height / 2,
  };
  const captionLeft = from.x - CAPTION_WIDTH / 2;
  const captionTop = from.y + BIG / 2;
  const amountWon = toWon - fromWon;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden"
      onClick={onEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: TOTAL, times: [0, 0.04, 0.9, 1] }}
    >
      <span aria-hidden className="absolute inset-0 bg-black/60" />

      {/* 어둠 위에 다시 그린 알약 — 숫자는 동전이 닿는 때부터 오른다 */}
      <motion.span
        aria-hidden
        className={`${REFUND_PILL_CLASS} ${REFUND_PILL_GOLD} absolute whitespace-nowrap shadow-[0_0_0_6px_rgba(255,255,255,0.22),0_0_28px_rgba(255,200,80,0.7)]`}
        style={{ left: pill.left, top: pill.top, minWidth: pill.width }}
        animate={{ scale: [1, 1, 1.14, 1, 1.1, 1, 1.08, 1] }}
        transition={{
          duration: 1,
          delay: LAND - 0.05,
          times: [0, 0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
        }}
      >
        <Coin size={REFUND_PILL_COIN} />
        <CountUpWon from={fromWon} to={toWon} delay={LAND} />
      </motion.span>

      {/* 큰 동전 뒤의 빛 */}
      <motion.span
        aria-hidden
        className="absolute rounded-full bg-[#ffc850]/40 blur-3xl"
        style={{
          left: from.x - BIG,
          top: from.y - BIG,
          width: BIG * 2,
          height: BIG * 2,
        }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.15, 1, 0.5], opacity: [0, 1, 1, 0] }}
        transition={{ delay: POP, duration: FLY, times: [0, 0.25, 0.8, 1] }}
      />

      {/* 큰 동전 — 통 튀어 올라 머물다가 알약으로 줄어들며 날아간다 */}
      <motion.span
        aria-hidden
        className="absolute"
        style={{ left: -BIG / 2, top: -BIG / 2 }}
        initial={{
          x: from.x,
          y: from.y + POP_RISE,
          scale: 0,
          opacity: 0,
          rotate: -25,
        }}
        animate={{
          x: [from.x, from.x, from.x, to.x],
          y: [from.y + POP_RISE, from.y, from.y, to.y],
          scale: [0, 1.15, 1, 0.17],
          opacity: [0, 1, 1, 0.9],
          rotate: [-25, 0, 0, 20],
        }}
        transition={{
          delay: POP,
          duration: LAND - POP,
          times: [0, 0.22, 0.66, 1],
          ease: ['backOut', 'linear', [0.6, 0, 0.3, 1]],
        }}
      >
        <Coin size={BIG} />
      </motion.span>

      {/* 받은 금액 — 큰 동전이 머무는 동안만 보인다 */}
      <motion.span
        aria-hidden
        className="absolute text-center text-[38px] leading-none font-black text-white"
        style={{
          width: CAPTION_WIDTH,
          left: captionLeft,
          top: captionTop + AMOUNT_GAP,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -8] }}
        transition={{
          delay: POP + 0.12,
          duration: FLY - POP + 0.1,
          times: [0, 0.25, 0.8, 1],
        }}
      >
        +{formatWon(amountWon)}
      </motion.span>

      {/* 잔동전 — 큰 동전에서 터져 나와 휘어지며 줄지어 알약으로 들어간다 */}
      {TRAIL.slice(0, coinCountOf(amountWon)).map((coin, index) => {
        const start = { x: from.x + coin.dx, y: from.y + coin.dy };
        const middle = {
          x: (start.x + to.x) / 2 + coin.bend,
          y: (start.y + to.y) / 2,
        };
        return (
          <motion.span
            key={index}
            aria-hidden
            className="absolute"
            style={{ left: -SMALL / 2, top: -SMALL / 2 }}
            initial={{ x: from.x, y: from.y, scale: 0, opacity: 0 }}
            animate={{
              x: [from.x, start.x, middle.x, to.x],
              y: [from.y, start.y, middle.y, to.y],
              scale: [0, 1.1, 1, 0.6],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              delay: FLY - 0.12 + index * TRAIL_STAGGER,
              duration: TRAIL_FLIGHT,
              times: [0, 0.22, 0.6, 1],
              ease: 'easeIn',
            }}
          >
            <Coin size={SMALL} />
          </motion.span>
        );
      })}

      {/* 금액과 떨어진 구석에 둔다 — 가까이 두면 받은 돈을 건너뛰는 것처럼 읽힌다. 누르면 바깥의 어둠이 끝낸다 */}
      <button
        type="button"
        className="absolute right-5 bottom-[max(var(--safe-area-inset-bottom),28px)] px-2 py-2 text-[14px] font-bold tracking-wide text-white/80"
      >
        {SKIP_LABEL}
      </button>
    </motion.div>,
    document.body,
  );
};
