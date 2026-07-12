'use client';

// 시나리오 카드 리스트 — 풀스크린 카드를 스냅으로 한 장씩 넘기고, 위아래로 이웃 카드가 살짝 보인다
import { motion } from 'motion/react';

import { LockIcon } from '@/shared/ui/Icons';

import type { Scenario } from '../api/list';
import { useSnapIndex } from '../model/useSnapIndex';
import { ScenarioCard } from './ScenarioCard';

interface ScenarioListProps {
  scenarios: Scenario[];
  onStart: (scenario: Scenario) => void;
}

export const ScenarioList = ({ scenarios, onStart }: ScenarioListProps) => {
  const { scrollRef, activeIndex, onScroll } = useSnapIndex();

  const allCompleted =
    scenarios.length > 0 && scenarios.every((scenario) => scenario.completed);

  return (
    <div className="relative min-h-0 flex-1">
      {/* 상하 패딩 22px = 슬라이드 부족분(44px)의 절반 — 첫/마지막 카드도 정확히 중앙에 선다 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full snap-y snap-mandatory overflow-y-auto py-[22px]"
      >
        {scenarios.map((scenario, index) => (
          // 슬라이드 높이 = 패딩 제외 영역(화면-44px) — snap-center로 중앙에 서면 이웃 카드가 위아래로 살짝 드러난다
          <div
            key={scenario.scenarioId}
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
              <ScenarioCard scenario={scenario} onStart={onStart} />
            </motion.div>
          </div>
        ))}

        {/* 마지막 페이지 — 전부 완료 축하 또는 다음 안내 */}
        <div className="flex h-full snap-center flex-col items-center justify-center gap-4 px-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- 구글이 호스팅하는 모션 이모지 GIF라 next/image 최적화 대상이 아니다 */}
          <img
            src={`https://fonts.gstatic.com/s/e/notoemoji/latest/${allCompleted ? '1f389' : '2753'}/512.gif`}
            alt={allCompleted ? '🎉' : '❓'}
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
        total={scenarios.length + 1}
        activeIndex={activeIndex}
        lastLocked={!allCompleted}
      />
    </div>
  );
};

// 우측 진행 인디케이터 — 마지막 칸은 미완료 상태면 자물쇠로 그린다
const ProgressDots = ({
  total,
  activeIndex,
  lastLocked,
}: {
  total: number;
  activeIndex: number;
  lastLocked: boolean;
}) => (
  <div className="absolute top-1/2 right-1 flex w-3 -translate-y-1/2 flex-col items-center gap-1.5">
    {Array.from({ length: total }).map((_, index) => {
      const isActive = index === activeIndex;

      if (index === total - 1 && lastLocked) {
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
      return (
        <div
          key={index}
          className={`w-1.5 rounded-full transition-all duration-300 ${
            isActive ? 'h-5 bg-foreground' : 'h-1.5 bg-muted-foreground/40'
          }`}
        />
      );
    })}
  </div>
);
