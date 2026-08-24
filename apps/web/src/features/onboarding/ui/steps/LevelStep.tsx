// 온보딩 6단계 — 대화 난이도를 맞추기 위해 영어 수준을 스스로 고른다
'use client';

import { useState } from 'react';
import type { EnglishLevel } from '@landit/analytics';

import { Button } from '@/shared/ui/Button';

import { EnglishLevelOptions } from '../common/EnglishLevelOptions';

export const LevelStep = ({
  onNext,
}: {
  onNext: (level: EnglishLevel) => void;
}) => {
  const [selected, setSelected] = useState<EnglishLevel | null>(null);

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pt-7">
        <h1 className="text-3xl leading-[1.18] font-black tracking-normal">
          영어를 얼마나
          <br />
          알고 계시나요?
        </h1>

        <EnglishLevelOptions selected={selected} onSelect={setSelected} />
      </div>

      <Button
        disabled={selected === null}
        onClick={() => selected && onNext(selected)}
      >
        선택했어요!
      </Button>
    </>
  );
};
