'use client';

// 시나리오 카드 — 앞면(썸네일·제목·브리핑·CTA), 완료 시 뒤집으면 뒷면에 표현 학습 리스트
import { useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

import { haptic } from '@/shared/haptics';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, LockIcon, ReplayIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import type { Scenario } from '../api/list';
import { getScenarioImage } from '../lib/scenario-image';
import { ScenarioCardBack } from './ScenarioCardBack';

interface ScenarioCardProps {
  scenario: Scenario;
  onStart: (scenario: Scenario) => void;
  // 방금 해금됐을 때 한 번 펄스로 강조한다
  highlight?: boolean;
  // 홈이 flip 신호로 진입하면(표현 마무리 후 복귀) 마운트 시 자동으로 뒷면을 편다
  autoFlip?: boolean;
}

export const ScenarioCard = ({
  scenario,
  onStart,
  highlight = false,
  autoFlip = false,
}: ScenarioCardProps) => {
  // 잠금·완료 판정은 전부 백엔드 몫(직전 시나리오를 깨야 다음이 열린다). 카드는 두 플래그를 그리기만 한다.
  // locked   → 흑백 썸네일 + 회색 제목 + "잠겨있어요"
  // completed → 썸네일 우상단 별점 배지 + 표현 학습(뒤집기) / 다시 해볼게요
  const { locked, completed } = scenario;

  // 뒤집기 상태. hasFlipped는 뒷면(표현 API)을 첫 뒤집기 전까지 마운트하지 않기 위한 지연 플래그.
  // autoFlip(표현 마무리 후 홈 복귀)이면 처음부터 뒤집힌 채로 마운트한다.
  const [flipped, setFlipped] = useState(autoFlip && completed);
  const [hasFlipped, setHasFlipped] = useState(autoFlip && completed);
  // completed가 마운트 후 뒤늦게 true가 돼도(캐시가 stale이었던 경우) autoFlip이면 한 번은 자동으로 편다.
  // 렌더 중 state 조정 패턴(effect 아님) — 사용자가 이후 앞면으로 되돌리는 건 막지 않는다.
  const [autoApplied, setAutoApplied] = useState(autoFlip && completed);
  if (autoFlip && completed && !autoApplied) {
    setAutoApplied(true);
    setFlipped(true);
    setHasFlipped(true);
  }

  // 백엔드 썸네일이 없으면 scenarioId로 번들 이미지를 매칭한다(S3 미구현 임시)
  const bundledImage = getScenarioImage(scenario.scenarioId);
  const filterClass = locked ? 'brightness-70 grayscale' : '';

  const openExpressions = () => {
    haptic('medium'); // 완료 카드를 뒤집는 성취 순간엔 좀 더 묵직한 진동
    setHasFlipped(true);
    setFlipped(true);
  };

  return (
    <motion.div
      animate={highlight ? { scale: [1, 1.03, 1] } : undefined}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
      className="relative h-full w-full [perspective:1600px]"
    >
      {/* 앞/뒤 면을 겹쳐 rotateY로 뒤집는다. preserve-3d 유지 위해 이 요소엔 overflow를 두지 않는다 */}
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(-180deg)]' : ''
        }`}
      >
        {/* 앞면 */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-card shadow-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
          {/* 썸네일 — 텍스트 영역을 제외한 카드 전체를 채운다 */}
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
              <div className="absolute top-3 right-3 rounded-full bg-black/45 px-3 py-2 shadow-sm backdrop-blur-sm">
                <StarRating rating={scenario.starRating ?? 0} size={24} />
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
            ) : completed ? (
              // 완료 카드 — 메인은 표현 학습(뒤집기), 다시 해보기는 아래 고스트로
              <div className="flex flex-col gap-1">
                <Button variant="primary" onClick={openExpressions}>
                  원어민 표현 배우기
                </Button>
                <button
                  type="button"
                  onClick={() => onStart(scenario)}
                  className="flex h-14 w-full items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors active:text-foreground"
                >
                  다시 대화하기
                  <ReplayIcon size={15} />
                </button>
              </div>
            ) : (
              <Button onClick={() => onStart(scenario)} variant="primary">
                대화 시작하기
                <ArrowRightIcon size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* 뒷면 — 완료 카드에서 첫 뒤집기 이후에만 마운트(표현 API 지연 호출) */}
        {completed && hasFlipped && (
          <div className="absolute inset-0 flex [transform:rotateY(-180deg)] flex-col overflow-hidden rounded-2xl bg-card shadow-md [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
            <ScenarioCardBack
              scenarioId={scenario.scenarioId}
              onBack={() => setFlipped(false)}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
