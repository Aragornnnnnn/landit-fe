// 영어 수준 선택지 목록 — 온보딩 스텝과 기존 유저 강제 체크가 함께 쓴다
'use client';

import type { EnglishLevel } from '@landit/analytics';

import { ENGLISH_LEVELS } from '../../model/english-level';

export const EnglishLevelOptions = ({
  selected,
  onSelect,
}: {
  selected: EnglishLevel | null;
  onSelect: (level: EnglishLevel) => void;
}) => (
  <div className="flex flex-col gap-3">
    {ENGLISH_LEVELS.map((level) => (
      <button
        key={level.id}
        type="button"
        onClick={() => onSelect(level.id)}
        aria-pressed={selected === level.id}
        className={`rounded-xl border px-4 py-4 text-left text-base font-semibold transition-colors ${
          selected === level.id
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-card text-foreground'
        }`}
      >
        {level.label}
      </button>
    ))}
  </div>
);
