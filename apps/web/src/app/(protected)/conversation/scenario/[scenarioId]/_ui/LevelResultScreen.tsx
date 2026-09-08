'use client';

// 레벨 결과 — 첫 대화로 매긴 수준을 캐릭터·이름·영역별 점수로 보여주고 "학습지 받기"로 넘긴다.
// 쓸 만한 결과(isUsableAssessment)일 때만 그린다. 그 다음 화면이 학습 준비, 그 다음이 페이월이다
import { useEffect } from 'react';
import { EVENTS, type EnglishLevel } from '@landit/analytics';
import Image from 'next/image';

import type { SessionLevelAssessment } from '@/features/feedback/api/level-assessment';
import { toLevelResult } from '@/features/feedback/model/level-assessment';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { Button } from '@/shared/ui/Button';

import { ScoreChart } from './ScoreChart';

interface LevelResultScreenProps {
  scenarioId: number;
  assessment: SessionLevelAssessment;
  onContinue: () => void;
}

// 레벨별 마법사 래디 — 피그마 2136:2437에서 배경 제거한 원본을 480px webp로
const LEVEL_IMAGE: Record<EnglishLevel, string> = {
  1: '/images/character/level-wizard-1.webp',
  2: '/images/character/level-wizard-2.webp',
  3: '/images/character/level-wizard-3.webp',
  4: '/images/character/level-wizard-4.webp',
  5: '/images/character/level-wizard-5.webp',
};

export const LevelResultScreen = ({
  scenarioId,
  assessment,
  onContinue,
}: LevelResultScreenProps) => {
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const result = toLevelResult(assessment);

  useEffect(() => {
    track(EVENTS.LEVEL_RESULT_VIEWED, {
      scenario_id: scenarioId,
      level: result.level,
      change_type: assessment.changeType,
    });
    // 노출은 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background px-6"
      style={{ paddingTop: 'calc(max(env(safe-area-inset-top), 18px) + 28px)' }}
    >
      {/* 캐릭터가 주인공 — 가운데 위에 크게, 이름과 레벨은 그 아래 중앙 정렬 */}
      <section className="flex flex-col items-center text-center">
        <Image
          src={LEVEL_IMAGE[result.level]}
          alt=""
          width={200}
          height={200}
          // 작은 폰(667pt)에서는 캐릭터를 줄여 표가 CTA 위로 더 올라오게 한다
          className="size-[200px] short:size-[132px]"
          priority
        />
        <p className="mt-1 text-[15px] font-medium text-muted-foreground">
          {nickname ? `${nickname}님의 레벨은` : '지금 레벨은'}
        </p>
        {/* 레벨은 이름 뒤에 작게 — 주황은 강점 태그와 CTA에만 남겨 시선을 나누지 않는다 */}
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[34px] leading-[1.15] font-black text-foreground">
            {result.name}
          </span>
          <span className="text-[16px] font-bold text-muted-foreground">
            Lv.{result.level}
          </span>
        </p>
      </section>

      <section className="mt-6 min-h-0 flex-1 overflow-y-auto short:mt-4">
        <h2 className="px-1 text-[15px] font-bold">영역별 점수</h2>
        <div className="mt-3">
          <ScoreChart rows={result.rows} />
        </div>
      </section>

      <div className="pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Button onClick={onContinue}>나에게 맞는 학습지 받기</Button>
      </div>
    </main>
  );
};
