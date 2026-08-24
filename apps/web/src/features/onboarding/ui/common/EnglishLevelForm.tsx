// 영어 수준 선택 폼 — 선택지 목록 + 확정 CTA 한 묶음. 온보딩 스텝·기존 유저 게이트·마이페이지 변경이 함께 쓴다.
// 고르면 CTA가 켜지고, CTA를 눌러야 확정된다
'use client';

import { useState } from 'react';
import type { EnglishLevel } from '@landit/analytics';

import { Button } from '@/shared/ui/Button';

import { EnglishLevelOptions } from './EnglishLevelOptions';

export const EnglishLevelForm = ({
  initial = null,
  onConfirm,
}: {
  // 마이페이지처럼 지금 값이 있으면 그걸 미리 골라둔 채 연다
  initial?: EnglishLevel | null;
  onConfirm: (level: EnglishLevel) => void;
}) => {
  const [selected, setSelected] = useState<EnglishLevel | null>(initial);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <EnglishLevelOptions selected={selected} onSelect={setSelected} />
      </div>

      <Button
        className="mt-4"
        disabled={selected === null}
        onClick={() => selected && onConfirm(selected)}
      >
        선택했어요!
      </Button>
    </>
  );
};
