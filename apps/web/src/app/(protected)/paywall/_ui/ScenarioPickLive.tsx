'use client';

// 시리즈 첫 카드의 오늘의 시나리오 — 카드가 화면에 들어오면 시나리오 100장 → 한 장 뽑힘 → 커져 놓임을 되풀이한다.
// 시나리오가 많다는 게 이 카드의 요점이라 이것만 움직이고, 대화 장면은 다음 카드가 보여 준다. 멈춰 있으면 뽑힌 한 장에 머문다
import { useInView } from '../_lib/useInView';
import { useLoopClock } from '../_lib/useLoopClock';
import { ScenarioDemo } from './ScenarioDemo';

/** 카드 더미 → 한 장 빛남 → 커져 놓임(대화 장면 전까지) */
const PICK_DURATIONS = [1100, 900, 2400] as const;

export const ScenarioPickLive = ({ width }: { width: number }) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { step } = useLoopClock(PICK_DURATIONS, inView);

  return (
    <div ref={ref}>
      <ScenarioDemo step={step} width={width} />
    </div>
  );
};
