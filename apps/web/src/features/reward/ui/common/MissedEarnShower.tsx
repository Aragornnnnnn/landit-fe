'use client';

// 환급을 시작하지 않은 사람이 오늘의 시나리오를 끝내고 홈에 돌아온 순간 — 받을 수 있었던 동전이 화면 가운데에 떴다가 잔동전으로 줄지어 헤더 알약으로 날아가지만,
// 들어가지 못하고 알약 앞에서 튕겨 떨어진다. 주변을 어둡게 눌러 동전과 알약만 남긴다. 화면 어디를 눌러도 바로 끝난다
import { useEffect, useEffectEvent, useState } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { formatWon } from '@/shared/lib/won';

import { Coin } from './Coin';

// 큰 동전이 뜨고, 잔동전이 나서고, 첫 동전이 알약에 닿는 때(초)
const POP = 0.3;
const HOLD = 1.5;
// 잔동전 하나가 날아가는 시간과, 다음 동전이 따라 나서는 간격
const TRAIL_FLIGHT = 0.5;
const TRAIL_STAGGER = 0.07;
// 잔동전이 흩어져 나오는 자리(큰 동전 중심 기준)·휘어지는 정도·알약에서 튕겨 나가는 방향
const TRAIL = [
  { dx: -46, dy: -18, bend: -70, bounce: 30 },
  { dx: 38, dy: -30, bend: 60, bounce: 44 },
  { dx: -14, dy: 34, bend: -40, bounce: 18 },
  { dx: 52, dy: 20, bend: 80, bounce: 56 },
  { dx: -58, dy: 26, bend: -90, bounce: 8 },
  { dx: 10, dy: -44, bend: 30, bounce: 38 },
  { dx: 28, dy: 46, bend: 50, bounce: 24 },
  { dx: -30, dy: -48, bend: -55, bounce: 50 },
  { dx: 62, dy: -8, bend: 95, bounce: 14 },
  { dx: -66, dy: -6, bend: -100, bounce: 34 },
];
const LAND = HOLD + TRAIL_FLIGHT;
// 마지막 동전이 떨어지고 잠깐 머문 뒤 어둠이 걷히기까지
const TOTAL = LAND + TRAIL.length * TRAIL_STAGGER + 1.4;

const BIG = 120;
const SMALL = 28;
// 알약 왼쪽 끝에서 동전이 닿는 자리까지
const PILL_TARGET_X = 18;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const MissedEarnShower = ({
  pill,
  amountWon,
  renderPill,
  onLand,
  onEnd,
}: {
  // 헤더 알약의 화면 자리 — 어둠 위에 같은 알약을 그려 그것만 밝게 남긴다
  pill: Box;
  amountWon: number;
  // 어둠 위에 다시 그릴 알약 — 닿기 전과 닿은 뒤의 글자가 다르다. 모양은 헤더가 정한다
  renderPill: (landed: boolean) => React.ReactNode;
  // 첫 동전이 알약에 닿았다 — 이때부터 헤더의 알약도 바뀐 글자로 선다
  onLand: () => void;
  // 다 돌았거나 건너뛰었다
  onEnd: () => void;
}) => {
  const [landed, setLanded] = useState(false);
  // 부르는 쪽이 다시 그려져도 타이머를 다시 걸지 않는다 — 걷힌 어둠이 화면을 막은 채 남으면 안 된다
  const land = useEffectEvent(() => {
    setLanded(true);
    onLand();
  });
  const end = useEffectEvent(onEnd);
  useEffect(() => {
    const landTimer = setTimeout(land, LAND * 1000);
    const endTimer = setTimeout(end, TOTAL * 1000);
    return () => {
      clearTimeout(landTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const from = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
  const to = { x: pill.left + PILL_TARGET_X, y: pill.top + pill.height / 2 };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden"
      // 다 돌기 전에 누른 것은 건너뛰기다 — 닿기 전에 눌러도 알약은 바뀐 글자로 남는다
      onClick={() => {
        if (!landed) onLand();
        onEnd();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: TOTAL, times: [0, 0.04, 0.92, 1] }}
    >
      <span aria-hidden className="absolute inset-0 bg-black/60" />

      {/* 어둠 위에 다시 그린 알약 — 첫 동전이 닿으면 좌우로 흔들리며 글자가 바뀐다 */}
      <motion.span
        aria-hidden
        className="absolute rounded-[10px] shadow-[0_0_0_6px_rgba(255,255,255,0.22),0_0_28px_rgba(255,200,80,0.7)]"
        style={{ left: pill.left, top: pill.top }}
        animate={landed ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        {renderPill(landed)}
      </motion.span>

      {/* 큰 동전 — 가운데에 떴다가, 잔동전들이 나서는 순간 줄어들며 사라진다 */}
      <motion.span
        aria-hidden
        className="absolute"
        style={{ left: -BIG / 2, top: -BIG / 2 }}
        initial={{ x: from.x, y: from.y + 30, scale: 0, opacity: 0 }}
        animate={{
          x: from.x,
          y: [from.y + 30, from.y, from.y, from.y],
          scale: [0, 1.15, 1, 0.4],
          opacity: [0, 1, 1, 0],
          rotate: [-25, 0, 0, 0],
        }}
        transition={{
          duration: HOLD + 0.3,
          times: [0, POP / (HOLD + 0.3), HOLD / (HOLD + 0.3), 1],
          ease: 'easeInOut',
        }}
      >
        <Coin size={BIG} />
      </motion.span>

      {/* 잔동전들이 줄지어 알약으로 날아간다 — 닿는 족족 알약 앞에서 튕겨 떨어진다 */}
      {TRAIL.map((coin, index) => (
        <motion.span
          key={index}
          aria-hidden
          className="absolute"
          style={{ left: -SMALL / 2, top: -SMALL / 2 }}
          initial={{ x: from.x + coin.dx, y: from.y + coin.dy, opacity: 0 }}
          animate={{
            x: [
              from.x + coin.dx,
              (from.x + to.x) / 2 + coin.bend,
              to.x,
              to.x + coin.bounce,
            ],
            y: [from.y + coin.dy, (from.y + to.y) / 2, to.y, to.y + 46],
            opacity: [0, 1, 1, 0],
            rotate: [0, 180, 360, 520],
            scale: [1, 1, 0.8, 0.7],
          }}
          transition={{
            delay: HOLD + index * TRAIL_STAGGER,
            duration: TRAIL_FLIGHT + 0.3,
            times: [0, 0.4, TRAIL_FLIGHT / (TRAIL_FLIGHT + 0.3), 1],
            ease: 'easeIn',
          }}
        >
          <Coin size={SMALL} />
        </motion.span>
      ))}

      {/* 무엇인지 — 동전 아래 두 줄 */}
      <motion.div
        className="absolute inset-x-0 text-center text-white"
        style={{ top: from.y + BIG / 2 + 16 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, 0] }}
        transition={{ duration: LAND, times: [0, 0.2, 0.75, 1] }}
      >
        <p className="text-15 font-bold text-white/85">
          방금 대화로 받을 수 있었던
        </p>
        <p className="mt-1 text-[40px] leading-none font-black text-[#ffd36b] tabular-nums">
          {formatWon(amountWon)}
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
};
