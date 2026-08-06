'use client';

// 대화 완료 축하 모먼트 — 오늘 열매가 찍히는 순간을 보여준다
// 순서가 곧 의미다. 지금까지 이은 줄이 먼저 서 있고, 열매가 떨어져 찍히고, 그제서야 며칠째인지 말한다.
// 조회가 아직이면 열매만 정적으로 — 숫자를 지어내느니 말을 아낀다
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import { EASE_STANDARD } from '@/shared/motion';

import { celebrationOf } from '../model/celebration';
import { streakRunOf, type StreakRunCell } from '../model/streak-run';
import { useCelebrationBase } from '../model/useCelebrationBase';
import { useStreakQuery } from '../model/useStreakQuery';
import { useStreakRecord } from '../model/useStreakRecord';
import { StreakFruit } from './StreakFruit';

// 열매가 찍히고, 오늘 칸이 차고, 문구가 선다
const DROP_DELAY = 0.15;
const FILL_DELAY = 0.55;
const TITLE_DELAY = 0.72;

// 줄에 놓이는 열매는 한 크기로만 그린다 — 오늘 칸만 확대해 같은 이미지를 다시 받지 않게 한다
const CELL_FRUIT_SIZE = 22;

export const StreakStamp = () => {
  const { streak } = useStreakQuery();
  const { totalActiveDays, longestStreakDays } = useStreakRecord();
  const base = useCelebrationBase();
  const reduceMotion = useReducedMotion();

  if (streak === null || streak.currentStreakDays === 0)
    return (
      <StampStage>
        <FruitMark animated={false} />
      </StampStage>
    );

  const celebration = celebrationOf({
    currentStreakDays: streak.currentStreakDays,
    base,
    totalActiveDays,
    longestStreakDays,
  });
  // 찍히는 연출을 안 할 땐(같은 날 두 번째 대화, 집어둔 값 없음) 처음부터 다 채워 둔다
  const animated = celebration.stamping && !reduceMotion;
  const cells = streakRunOf({
    currentStreakDays: streak.currentStreakDays,
    activeToday: streak.activeToday,
    today: streak.today,
  });

  return (
    <StampStage>
      <span className="sr-only">
        {celebration.title}. {celebration.guide}
      </span>

      <motion.div
        aria-hidden
        className="flex flex-col items-center"
        initial={animated ? 'before' : false}
        animate="after"
      >
        {celebration.first ? (
          <FirstFruitMark animated={animated} />
        ) : (
          <FruitMark animated={animated} />
        )}

        {/* 화면의 주인공은 위의 "잘 완료했어요" 한 줄이다 — 여기 숫자는 그보다 작게 눌러 둔다 */}
        <motion.div
          className="mt-4 flex flex-col items-center"
          variants={{
            before: { opacity: 0, y: 10 },
            after: { opacity: 1, y: 0 },
          }}
          transition={{ delay: TITLE_DELAY, duration: 0.32 }}
        >
          <p className="text-[26px] leading-none font-extrabold text-foreground">
            {celebration.title}
          </p>
          {/* 고비를 채운 날 문구는 길어서 두 줄로 감긴다 — 가운데 정렬로 감겨야 줄이 흐트러지지 않는다 */}
          <p className="mt-2.5 text-center text-sm font-medium text-muted-foreground">
            {celebration.guide}
          </p>
        </motion.div>

        <StreakRun cells={cells} animated={animated} />
      </motion.div>
    </StampStage>
  );
};

const StampStage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
    {children}
  </div>
);

// 닿은 충격 — 선이 아니라 빛이 번진다. 테두리 원이 퍼지면 파문이 아니라 도형으로 읽힌다
const StampRipple = () => (
  <motion.span
    aria-hidden
    className="absolute size-[104px] rounded-full bg-primary/30 blur-md"
    initial={{ scale: 0.45, opacity: 0 }}
    animate={{ scale: [0.45, 1.6], opacity: [0.6, 0] }}
    transition={{ delay: DROP_DELAY + 0.12, duration: 0.62, ease: 'easeOut' }}
  />
);

// 도장 — 열매가 위에서 떨어져 찍히고, 닿은 자리에서 파문이 번지고 그림자가 눌린다
const FruitMark = ({ animated }: { animated: boolean }) => (
  <div className="relative flex size-[132px] items-center justify-center">
    {/* 열매 뒤에 깔리는 온기. 찍힌 자리가 밝아 보여야 도장이 무게를 갖는다 */}
    <span
      aria-hidden
      className="absolute size-[132px] rounded-full bg-streak-band blur-xl"
    />
    {animated && <StampRipple />}

    <motion.div
      className="relative"
      initial={animated ? { y: -64, scale: 1.3, opacity: 0 } : false}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      transition={{
        delay: DROP_DELAY,
        type: 'spring',
        stiffness: 620,
        damping: 20,
      }}
    >
      {/* 바닥에 닿았다는 표시 — 열매 밑에 눌린 그림자 하나 */}
      <span
        aria-hidden
        className="absolute inset-x-4 -bottom-1 h-2 rounded-full bg-foreground/10 blur-[6px]"
      />
      <StreakFruit state="fresh" size={88} animated priority />
    </motion.div>
  </div>
);

// 첫 열매인 날만 — 래디가 그 열매를 받아 먹는다. 계정당 한 번뿐이라 낙하 대신 톡 튀어 나온다
const FirstFruitMark = ({ animated }: { animated: boolean }) => (
  <div className="relative flex size-[184px] items-center justify-center">
    {animated && <StampRipple />}

    <motion.div
      initial={animated ? { scale: 0.55, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: DROP_DELAY,
        type: 'spring',
        stiffness: 420,
        damping: 18,
      }}
    >
      <Image
        src="/images/character/landy-eating-fruit.webp"
        alt=""
        width={184}
        height={184}
        className="animate-landy-chew motion-reduce:animate-none"
        priority
      />
    </motion.div>
  </div>
);

// 이번 스트릭 줄 — 이미 이은 칸은 서 있고, 오늘 칸만 도장에 맞춰 뒤늦게 찬다.
// 뒤늦게 차는 칸은 하나뿐이라 타이머도 여기 하나만 둔다
const StreakRun = ({
  cells,
  animated,
}: {
  cells: StreakRunCell[];
  animated: boolean;
}) => {
  const [stamped, setStamped] = useState(!animated);
  useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => setStamped(true), FILL_DELAY * 1000);
    return () => clearTimeout(timer);
  }, [animated]);

  return (
    <motion.div
      className="mt-9 flex justify-center gap-1.5 rounded-[20px] border border-border bg-card px-3 py-3.5"
      variants={{
        before: { opacity: 0, y: 12 },
        after: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.35, ease: EASE_STANDARD }}
    >
      {cells.map((cell) => (
        <RunCell
          key={cell.date}
          cell={cell}
          // 오늘 칸은 도장이 찍히는 순간에 맞춰 찬다. 그 전까진 열매가 들어올 자리로 비어 있다
          filled={cell.filled && (stamped || !cell.latest)}
          popping={animated && cell.latest}
        />
      ))}
    </motion.div>
  );
};

const RunCell = ({
  cell,
  filled,
  popping,
}: {
  cell: StreakRunCell;
  filled: boolean;
  popping: boolean;
}) => (
  // 칸 높이를 오늘 칸에 맞춰 잡아 둔다 — 오늘만 크다고 요일 줄이 삐뚤어지면 안 된다
  <div className="flex w-9 flex-col items-center gap-1.5">
    <div className="flex h-10 items-center justify-center">
      <div
        className={`flex items-center justify-center rounded-full transition-colors duration-300 ${
          cell.latest ? 'size-10 ring-2 ring-primary' : 'size-9'
        } ${filled ? 'bg-streak-band' : 'bg-muted'}`}
      >
        {filled && (
          // 확대는 바깥, 등장은 안쪽 — 같은 엘리먼트에 CSS transform과 모션을 같이 걸면 하나가 죽는다
          <span className={cell.latest ? 'flex scale-[1.18]' : 'flex'}>
            <motion.span
              className="flex"
              initial={popping ? { scale: 0.2, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 700, damping: 18 }}
            >
              <StreakFruit state="fresh" size={CELL_FRUIT_SIZE} />
            </motion.span>
          </span>
        )}
      </div>
    </div>
    <span
      className={`text-[12px] leading-none ${
        cell.latest
          ? 'font-bold text-primary'
          : filled
            ? 'font-medium text-accent'
            : 'font-medium text-muted-foreground'
      }`}
    >
      {cell.label}
    </span>
  </div>
);
