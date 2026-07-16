// 온보딩 5단계 — 첫 시나리오 소개 후 대화 시작 유도
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';

import type { Scenario } from '@/features/scenario/api/list';
import { useScenarios } from '@/features/scenario/model/useScenarios';
import { Button } from '@/shared/ui/Button';

import firstScenarioImage from '../assets/first-scenario.webp';

export const ScenarioStep = ({
  onStart,
}: {
  // 소개한 첫 시나리오로 곧장 대화를 시작한다 — 못 받았으면 null(홈 폴백)
  onStart: (scenarioId: number | null) => void;
}) => {
  // 첫 대화 = 첫(미잠금) 카테고리의 첫 시나리오 — 홈 리스트가 보여주는 것과 같은 순서
  const { selected } = useScenarios();
  const scenario = selected?.scenarios[0] ?? null;

  const [isUnlocked, setIsUnlocked] = useState(false);
  useEffect(() => {
    // 마지막 유도 스텝은 뜸 들이지 않는다 — 이미지·글자가 빨리 떠야 바로 시작으로 이어진다
    const timer = setTimeout(() => setIsUnlocked(true), 250);
    return () => clearTimeout(timer);
  }, []);

  // 텍스트는 잠금 해제 애니메이션과 시나리오 로딩이 모두 끝난 뒤 보여준다
  const showText = isUnlocked && scenario !== null;

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          준비는 끝났어요
          <br />첫 번째 대화가 기다리고 있어요
        </h1>

        <ScenarioCard scenario={scenario} showText={showText} />
      </div>

      <Button
        onClick={() => onStart(scenario?.scenarioId ?? null)}
        disabled={!isUnlocked}
      >
        시작할게요!
      </Button>
    </>
  );
};

// 시나리오 이미지와 제목·브리핑 카드 — 텍스트는 잠금 해제 후 페이드 인
const ScenarioCard = ({
  scenario,
  showText,
}: {
  scenario: Scenario | null;
  showText: boolean;
}) => (
  <div className="flex flex-1 flex-col gap-4">
    <div
      className="relative w-full overflow-hidden rounded-3xl bg-secondary"
      style={{ aspectRatio: '4/3' }}
    >
      {/* 첫 시나리오 전용 번들 이미지 — API를 기다리지 않고 즉시 뜬다(blur 자동).
          세로 원본이라 얼굴·손인사가 있는 상단 35% 지점을 보여준다 */}
      <Image
        src={firstScenarioImage}
        alt=""
        fill
        sizes="(max-width: 430px) 100vw, 430px"
        placeholder="blur"
        priority
        className="object-cover object-[50%_35%]"
      />
    </div>

    <AnimatePresence>
      {showText && scenario && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
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
