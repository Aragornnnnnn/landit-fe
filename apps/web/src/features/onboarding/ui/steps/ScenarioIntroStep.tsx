// 온보딩 마지막 — 첫 대화(수준 파악)의 상황을 카드로 먼저 보여주고, 누르면 홈에서 램프가 열리며 그 대화로 이어진다
'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import type { DailyScenario } from '@/features/scenario/api/daily';
import { Button } from '@/shared/ui/Button';

import lampPeekImage from '../../assets/landy-lamp-peek.webp';
import { startLabelOf } from '../../model/scenario-intro';

interface ScenarioIntroStepProps {
  // 오늘 받을 첫 시나리오. 못 받았으면 null — 카드 없이도 시작은 할 수 있어야 한다
  scenario: DailyScenario | null;
  loading: boolean;
  onStart: () => void;
}

export const ScenarioIntroStep = ({
  scenario,
  loading,
  onStart,
}: ScenarioIntroStepProps) => (
  <>
    <div className="flex min-h-0 flex-1 flex-col pt-7 pb-6">
      <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
        첫 대화로 내 레벨을 찾고
        <br />딱 맞게 배워요
      </h1>

      <IntroVisual scenario={scenario} loading={loading} />
    </div>

    <Button onClick={onStart}>
      {startLabelOf(scenario?.openingPreview?.character.characterId ?? null)}
    </Button>
  </>
);

const IntroVisual = ({
  scenario,
  loading,
}: Pick<ScenarioIntroStepProps, 'scenario' | 'loading'>) => {
  if (scenario) return <ScenarioCard scenario={scenario} />;

  if (loading) {
    return (
      <div className="mt-6 min-h-0 flex-1 animate-pulse rounded-2xl bg-secondary" />
    );
  }

  // 시나리오를 못 받으면 예전 램프 그림으로 자리를 채운다 — 홈에서 열릴 그 램프다
  return (
    <div className="flex flex-1 items-center justify-center">
      <Image
        src={lampPeekImage}
        alt=""
        sizes="280px"
        placeholder="blur"
        className="w-full max-w-[280px]"
      />
    </div>
  );
};

// 홈 브리핑 카드와 같은 모양 — 브리핑에서 이 카드를 다시 보면 "아까 그 대화"로 알아본다
const ScenarioCard = ({ scenario }: { scenario: DailyScenario }) => {
  const reduced = useReducedMotion() ?? false;
  // 썸네일 주소가 깨지면 브라우저의 깨진 그림 대신 빈 회색 칸을 남긴다
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.div
      className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-[0_6px_20px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.15 }}
    >
      <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-secondary">
        {scenario.thumbnailUrl && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다
          <img
            src={scenario.thumbnailUrl}
            alt=""
            decoding="async"
            onError={() => setImageFailed(true)}
            // 세로 그림을 가로 칸에 담으면 가운데가 몸통이라, 얼굴이 보이게 위쪽에 맞춘다
            className="h-full w-full object-cover object-[50%_15%]"
          />
        )}
      </div>
      <div className="flex flex-none flex-col gap-2 px-5 pt-5 pb-6">
        {/* 두 줄로 넘칠 때 마지막 한 어절만 아래로 떨어지지 않게 줄 길이를 고르게 나눈다 */}
        <p className="text-xl leading-snug font-bold text-balance break-keep text-foreground">
          {scenario.scenarioTitle}
        </p>
        <p className="text-[15px] leading-relaxed break-keep text-muted-foreground">
          {scenario.briefing}
        </p>
      </div>
    </motion.div>
  );
};
