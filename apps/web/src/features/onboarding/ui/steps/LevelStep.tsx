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

    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <EnglishLevelForm onConfirm={onNext} />
    </div>
  </div>
);
