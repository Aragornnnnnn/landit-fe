'use client';

// 시나리오 카드 — 썸네일·제목·브리핑과 상태(난이도·완료·잠금), 시작 CTA
import { motion } from 'motion/react';
import Image from 'next/image';

import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, LockIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import type { Scenario } from '../api/list';
import { getScenarioImage } from '../lib/scenario-image';

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
  // 방금 해금됐을 때 한 번 펄스로 강조한다
  highlight?: boolean;
}

export const ScenarioCard = ({
  scenario,
  onStart,
  highlight = false,
}: ScenarioCardProps) => {
  // 잠금·완료 판정은 전부 백엔드 몫(직전 시나리오를 깨야 다음이 열린다). 카드는 두 플래그를 그리기만 한다.
  // locked   → 흑백 썸네일 + 회색 제목 + "잠겨있어요"
  // completed → 썸네일 우상단 별점 배지 + "다시 해볼게요"
  const { locked, completed } = scenario;

  // 백엔드 썸네일이 없으면 scenarioId로 번들 이미지를 매칭한다(S3 미구현 임시)
  const bundledImage = getScenarioImage(scenario.scenarioId);
  const filterClass = locked ? 'brightness-70 grayscale' : '';

  return (
    <motion.div
      animate={highlight ? { scale: [1, 1.03, 1] } : undefined}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-md"
    >
      {/* 썸네일 — 텍스트 영역을 제외한 카드 전체를 채운다. 카드가 화면을 꽉 채우는 건 뒷면(표현학습 뒤집기, 후속 이슈)을 담기 위함 */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-foreground">
        {scenario.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다
          <img
            src={scenario.thumbnailUrl}
            alt={scenario.scenarioTitle}
            className={`h-full w-full object-cover transition-[filter] duration-500 ${filterClass}`}
          />
        ) : bundledImage ? (
          // 번들 이미지는 정적 import라 blurDataURL 자동 — 흐린 썸네일이 즉시 깔리고 본 이미지가 페이드인, 화면 밖 카드는 자동 lazy
          <Image
            src={bundledImage}
            alt={scenario.scenarioTitle}
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            placeholder="blur"
            className={`object-cover transition-[filter] duration-500 ${filterClass}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="tossface text-6xl">💬</span>
          </div>
        )}

        {/* 완료 시 별점을 썸네일 우상단에 배지로 띄운다 — 어두운 스크림으로 밝은/어두운 이미지 모두에서 대비 확보 */}
        {completed && (
          <div className="absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-1.5 shadow-sm backdrop-blur-sm">
            <StarRating rating={scenario.starRating ?? 0} size={16} />
          </div>
        )}
      </div>

      {/* 텍스트 + CTA */}
      <div className="flex flex-none flex-col gap-3 px-5 pt-4 pb-5">
        <div>
          <p
            className={`text-xl leading-snug font-extrabold ${
              locked ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {scenario.scenarioTitle}
          </p>
          {scenario.briefing && (
            <p className="mt-2 text-sm leading-relaxed font-medium text-muted-foreground">
              {scenario.briefing}
            </p>
          )}
        </div>

        {locked ? (
          <div className="flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary text-base font-bold text-muted-foreground">
            잠겨있어요 <LockIcon size={16} />
          </div>
        ) : (
          <Button
            onClick={() => onStart(scenario)}
            variant={completed ? 'secondary' : 'primary'}
          >
            {completed ? '다시 해볼게요' : '시작할게요'}
            <ArrowRightIcon size={16} />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
