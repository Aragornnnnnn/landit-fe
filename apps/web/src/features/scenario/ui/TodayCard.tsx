'use client';

// 오늘의 카드 — 아직 안 끝낸 날은 램프에서 자는 래디를 보여주고 대화로 들어간다.
// 끝낸 날만 카드 앞면(별점·표현)을 편다. 상태는 서버가 준 것만 믿는다
import { motion, useReducedMotion } from 'motion/react';

import { EASE_STANDARD } from '@/shared/motion';

import type { DailyScenario } from '../api/daily';
import { toScenario, type Scenario } from '../lib/to-scenario';
import { LampWaiting } from './LampWaiting';
import { ScenarioCard } from './ScenarioCard';

interface TodayCardProps {
  // 그날 배정된 시나리오. 없는 날은 이 컴포넌트를 그리지 않는다
  daily: DailyScenario;
  // 시작 가능 여부는 서버 판정을 그대로 따른다 — 지금은 시나리오가 있으면 늘 true지만,
  // 나중에 "카드는 주되 시작은 막는" 경우가 생겨도 화면을 고치지 않아도 된다
  playable: boolean;
  onStart: (scenario: Scenario) => void;
  // 어느 날 카드인지. 뒷면에서 표현 학습으로 들어갈 때 이어 나른다
  date?: string;
  // 표현 마무리 후 복귀 — 완료 카드를 뒷면(표현 리스트)으로 펴 둔다
  autoFlip?: boolean;
}

export const TodayCard = ({
  daily,
  playable,
  onStart,
  date,
  autoFlip = false,
}: TodayCardProps) => {
  const reduced = useReducedMotion() ?? false;
  const scenario = toScenario(daily, playable);

  return (
    <Arrival reduced={reduced}>
      {daily.dailyScenarioType === 'CLEARED' ? (
        <ScenarioCard
          scenario={scenario}
          onStart={onStart}
          date={date}
          autoFlip={autoFlip}
          expressions={{
            completed: daily.completedExpressionCount,
            total: daily.expressionCount,
          }}
        />
      ) : (
        // TODO(소환 오버레이 PR): 지금은 부르는 즉시 대화로 보낸다 — 아직 열 오버레이가 없다
        <LampWaiting
          retry={daily.dailyScenarioType === 'RETRY'}
          onSummon={playable ? () => onStart(scenario) : undefined}
        />
      )}
    </Arrival>
  );
};

// 도착 — 카드가 위에서 살짝 오버슈트하며 내려앉고 그림자가 같이 자리를 잡는다.
// 내려앉은 뒤로는 움직이지 않는다 — 부유가 이어지면 CTA가 흔들리는 표적이 된다.
// 연출은 이 껍데기 하나에만 있다. 빼고 싶으면 이 컴포넌트를 걷어내면 된다
const Arrival = ({
  children,
  reduced,
}: {
  children: React.ReactNode;
  reduced: boolean;
}) => (
  <div className="flex min-h-0 flex-1 items-center justify-center px-6 pt-2 pb-4">
    <div className="relative h-full w-full">
      {/* initial={false}면 도착 상태로 바로 그린다 — 연출을 끈 사람에게는 애니메이션이 없다 */}
      <motion.div
        aria-hidden
        className="absolute -bottom-1 left-1/2 h-5 w-3/5 -translate-x-1/2 rounded-[50%] bg-foreground blur-md"
        initial={reduced ? false : { opacity: 0, scaleX: 0.55 }}
        animate={{ opacity: 0.2, scaleX: 1 }}
        transition={{ duration: 0.55, ease: EASE_STANDARD }}
      />
      <motion.div
        className="h-full w-full"
        initial={reduced ? false : { y: -90, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 14, mass: 0.9 }}
      >
        {children}
      </motion.div>
    </div>
  </div>
);
