// 온보딩 5단계 — 첫 시나리오 소개 후 대화 시작 유도
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';

// TODO: 시나리오 API 연동 시 응답 첫 시나리오로 교체
const PLACEHOLDER_SCENARIO = {
  scenarioId: 1,
  scenarioTitle: '음식 취향 이야기하기',
  briefing: '좋아하는 음식과 최근 먹었던 음식에 대해 이야기합니다.',
};

type Scenario = typeof PLACEHOLDER_SCENARIO;

export const ScenarioStep = ({ onStart }: { onStart: () => void }) => {
  const scenario = PLACEHOLDER_SCENARIO;

  const [isUnlocked, setIsUnlocked] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsUnlocked(true), 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          준비는 끝났어요
          <br />첫 번째 대화가 기다리고 있어요
        </h1>

        <ScenarioCard scenario={scenario} isUnlocked={isUnlocked} />
      </div>

      <Button onClick={onStart} disabled={!isUnlocked}>
        시작할게요!
      </Button>
    </>
  );
};

// 시나리오 이미지와 제목·브리핑 카드 — 텍스트는 잠금 해제 후 페이드 인
const ScenarioCard = ({
  scenario,
  isUnlocked,
}: {
  scenario: Scenario;
  isUnlocked: boolean;
}) => {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-3xl"
        style={{ aspectRatio: '4/3' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/images/scenarios/scenario-${scenario.scenarioId}.webp`}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <AnimatePresence>
        {isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <p className="text-lg font-extrabold text-foreground">
              {scenario.scenarioTitle}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
              {scenario.briefing}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
