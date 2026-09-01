// 배울 영어 선택 폼 — 선택지 목록 + 확정 CTA 한 묶음. 온보딩 스텝과 마이페이지 변경이 함께 쓴다.
// 선택지는 프론트 상수라 언제나 바로 그린다. 조회는 어느 걸 강조할지에만 쓴다
'use client';

import { useState } from 'react';
import type { AccentLocale } from '@landit/analytics';

import { Button } from '@/shared/ui/Button';

import { DEFAULT_ACCENT } from '../../model/accent';
import { AccentOptions } from './AccentOptions';

export const AccentForm = ({
  initial = DEFAULT_ACCENT,
  footnote,
  onConfirm,
}: {
  // 처음 골라둘 값. 마이페이지처럼 지금 값이 있으면 그걸 미리 골라둔 채 연다.
  // null이면 아무것도 안 고른 채로 연다 — 지금 값을 아직 모를 때다.
  // 그땐 CTA가 잠겨서, 기본값(미국 영어)으로 원래 값을 덮어쓰는 일이 없다
  initial?: AccentLocale | null;
  // 선택지 아래 각주 — 마이페이지에서 바꿀 수 있다는 안내는 온보딩에서만 할 말이라 화면이 정한다
  footnote?: string;
  onConfirm: (locale: AccentLocale) => void;
}) => {
  const [selected, setSelected] = useState<AccentLocale | null>(initial);

  return (
    <>
      {/* pb-1 — 마지막 카드의 3px 엣지 그림자가 스크롤 경계에 잘리지 않게 숨 쉴 틈을 둔다 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-1">
        <AccentOptions selected={selected} onSelect={setSelected} />
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
