// 온보딩 5단계 — 첫 시나리오 소개 후 대화 시작 유도
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';

import type { Scenario } from '@/features/scenario/api/list';
import { getScenarioImage } from '@/features/scenario/lib/scenario-image';
import { useScenarios } from '@/features/scenario/model/useScenarios';
import { Button } from '@/shared/ui/Button';

export const ScenarioStep = ({ onStart }: { onStart: () => void }) => {
  // 첫 대화 = 첫(미잠금) 카테고리의 첫 시나리오 — 홈 리스트가 보여주는 것과 같은 순서
  const { selected } = useScenarios();
  const scenario = selected?.scenarios[0] ?? null;

  const [isUnlocked, setIsUnlocked] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsUnlocked(true), 650);
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

      <Button onClick={onStart} disabled={!isUnlocked}>
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
}) => {
  // 홈 리스트와 같은 규칙으로 첫 시나리오 이미지를 고른다. 로딩 중엔 중립 배경만.
  const bundledImage = scenario ? getScenarioImage(scenario.scenarioId) : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className="relative w-full overflow-hidden rounded-3xl bg-secondary"
        style={{ aspectRatio: '4/3' }}
      >
        {bundledImage && (
          // 정적 import라 blurDataURL 자동 — 흐린 썸네일이 즉시 깔리고 본 이미지가 페이드인
          <Image
            src={bundledImage}
            alt=""
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            placeholder="blur"
            className="object-cover"
          />
        )}
      </div>

      <AnimatePresence>
        {showText && scenario && (
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
