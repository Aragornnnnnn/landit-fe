'use client';

// 시나리오 카드 리스트 — 풀스크린 카드를 스냅으로 한 장씩 넘기고, 위아래로 이웃 카드가 살짝 보인다
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { LockIcon } from '@/shared/ui/Icons';

import type { Scenario } from '../api/list';
import { useSnapIndex } from '../model/useSnapIndex';
import { ScenarioCard } from './ScenarioCard';

interface ScenarioListProps {
  scenarios: Scenario[];
  onStart: (scenario: Scenario) => void;
  // 방금 대화를 끝내 다음 시나리오가 해금됐을 때, 그 카드로 스크롤·강조한다
  focusActive?: boolean;
  // 표현 마무리 후 홈 복귀 시, 이 시나리오 카드로 스크롤하고 자동으로 뒤집는다
  flipScenarioId?: number | null;
}

export const ScenarioList = ({
  scenarios,
  onStart,
  focusActive = false,
  flipScenarioId = null,
}: ScenarioListProps) => {
  const { scrollRef, activeIndex, onScroll } = useSnapIndex();

  const allCompleted =
    scenarios.length > 0 && scenarios.every((scenario) => scenario.completed);

  // 다음 도전할 시나리오 — 첫 미완료·미잠금 카드.
  const nextIndex = scenarios.findIndex(
    (scenario) => !scenario.completed && !scenario.locked,
  );
  // 표현 마무리 후 복귀한 대상 카드(있으면). 이 카드는 자동으로 뒤집힌다.
  const flipIndex =
    flipScenarioId != null
      ? scenarios.findIndex(
          (scenario) => scenario.scenarioId === flipScenarioId,
        )
      : -1;
  // 진입 시 위치를 잡을 카드 — flip 대상이 있으면 그 카드, 없으면 다음 도전 카드
  const targetIndex = flipIndex >= 0 ? flipIndex : nextIndex;

  const targetRef = useRef<HTMLDivElement>(null);
  // 진입·카테고리 전환 시 대상 카드로 부드럽게 스크롤한다.
  useEffect(() => {
    if (targetIndex >= 0) {
      targetRef.current?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [targetIndex]);

  return (
    <div className="relative min-h-0 flex-1">
      {/* 상하 패딩 = 이웃 카드 peek 겸 첫/마지막 카드 위아래 여백 — 이 둘은 같은 값이라 키우면 peek↑·첫 카드 위 여백↑ */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto py-[22px]"
      >
        {scenarios.map((scenario, index) => (
          // 슬라이드 높이 = 패딩 제외 영역(화면-44px) — snap-center로 중앙에 서면 이웃 카드가 위아래로 살짝 드러난다
          <div
            key={scenario.scenarioId}
            ref={index === targetIndex ? targetRef : undefined}
            className="h-full snap-center px-5 py-2"
          >
            <motion.div
              className="h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.38,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ScenarioCard
                scenario={scenario}
                onStart={onStart}
                highlight={flipIndex < 0 && focusActive && index === nextIndex}
                autoFlip={index === flipIndex}
                focusActive={focusActive}
              />
            </motion.div>
          </div>
        ))}

        {/* 마지막 페이지 — 전부 완료 축하 또는 다음 안내 */}
        <div className="flex h-full snap-center flex-col items-center justify-center gap-4 px-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- 구글이 호스팅하는 모션 이모지 GIF라 next/image 최적화 대상이 아니다 */}
          <img
            src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${allCompleted ? '1f389' : '1f512'}/512.gif`}
            alt={allCompleted ? '🎉' : '🔒'}
            width={120}
            height={120}
          />
          <div>
            <p className="text-2xl leading-snug font-extrabold text-foreground">
              {allCompleted
                ? '모든 상황을 해보셨네요!'
                : '다음 상황이 기다리고 있어요'}
            </p>
            <p className="mt-3 text-base font-medium text-muted-foreground">
              {allCompleted
                ? '더 많은 상황으로 곧 찾아올게요!'
                : '앞의 대화를 모두 끝내면 열려요'}
            </p>
          </div>
        </div>
      </div>

      <ProgressDots
        scenarios={scenarios}
        activeIndex={activeIndex}
        allCompleted={allCompleted}
      />
    </div>
  );
};

// 우측 진행 인디케이터 — 완료=검정, 다음 깨야 할 것=주황(딱 하나), 나머지=회색.
// 자물쇠는 최종 목표인 맨 마지막 칸에만(전체 완료 전까지). 현재 보는 카드는 세로로 길쭉하게.
const ProgressDots = ({
  scenarios,
  activeIndex,
  allCompleted,
}: {
  scenarios: Scenario[];
  activeIndex: number;
  allCompleted: boolean;
}) => {
  // 다음 깨야 할 것 — 첫 미완료·미잠금 시나리오 하나만 주황으로 강조한다
  const nextIndex = scenarios.findIndex((s) => !s.completed && !s.locked);

  return (
    <div className="absolute top-1/2 right-1 flex w-3 -translate-y-1/2 flex-col items-center gap-1.5">
      {Array.from({ length: scenarios.length + 1 }).map((_, index) => {
        const isActive = index === activeIndex;
        const isEnd = index === scenarios.length; // scenarios 뒤에 붙는 최종 목표 칸

        // 최종 목표는 전체 완료 전엔 자물쇠로 그린다 (마지막 한 곳만 자물쇠)
        if (isEnd && !allCompleted) {
          return (
            <LockIcon
              key={index}
              size={12}
              className={
                isActive ? 'text-foreground' : 'text-muted-foreground/40'
              }
            />
          );
        }

        const completed = isEnd ? allCompleted : scenarios[index].completed;
        const isNext = index === nextIndex;

        return (
          <div
            key={index}
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isActive ? 'h-5' : 'h-1.5'
            } ${
              completed
                ? 'bg-foreground'
                : isNext
                  ? 'bg-primary'
                  : 'bg-muted-foreground/40'
            }`}
          />
        );
      })}
    </div>
  );
};
