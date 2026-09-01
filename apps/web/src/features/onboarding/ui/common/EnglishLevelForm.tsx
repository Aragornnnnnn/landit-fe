// 영어 수준 선택 폼 — 선택지 목록 + 확정 CTA 한 묶음. 온보딩 스텝·기존 유저 게이트·마이페이지 변경이 함께 쓴다.
// 고르면 CTA가 켜지고, CTA를 눌러야 확정된다
'use client';

import { useState } from 'react';
import type { EnglishLevel } from '@landit/analytics';

import { Button } from '@/shared/ui/Button';

import { EnglishLevelOptions } from './EnglishLevelOptions';

export const EnglishLevelForm = ({
  initial = null,
  footnote,
  onConfirm,
}: {
  // 마이페이지처럼 지금 값이 있으면 그걸 미리 골라둔 채 연다
  initial?: EnglishLevel | null;
  // 선택지 아래 각주 — 마이페이지에서 바꿀 수 있다는 안내는 온보딩에서만 할 말이라 화면이 정한다
  footnote?: string;
  onConfirm: (level: EnglishLevel) => void;
}) => {
  const [selected, setSelected] = useState<EnglishLevel | null>(initial);

  return (
    <>
      {/* pb-1 — 마지막 카드의 3px 엣지 그림자가 스크롤 경계에 잘리지 않게 숨 쉴 틈을 둔다 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-1">
        <EnglishLevelOptions selected={selected} onSelect={setSelected} />
        {footnote && (
          <p className="mt-3.5 text-[13px] text-muted-foreground">{footnote}</p>
        )}
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
