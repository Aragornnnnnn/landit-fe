// 온보딩 6단계 — 대화 난이도를 맞추기 위해 영어 수준을 스스로 고른다
'use client';

import type { EnglishLevel } from '@landit/analytics';

import { EnglishLevelForm } from '../common/EnglishLevelForm';

export const LevelStep = ({
  onNext,
}: {
  onNext: (level: EnglishLevel) => void;
}) => (
  <div className="flex min-h-0 flex-1 flex-col pt-7">
    <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
      영어를 얼마나
      <br />
      알고 계신지 알려주세요
    </h1>
    <p className="mt-4 text-xl font-bold text-muted-foreground">
      딱 맞는 학습을 준비해드릴게요
    </p>

    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <EnglishLevelForm
        footnote="학습 수준은 마이페이지에서 언제든 변경할 수 있어요"
        onConfirm={onNext}
      />
    </div>
  </div>
);
