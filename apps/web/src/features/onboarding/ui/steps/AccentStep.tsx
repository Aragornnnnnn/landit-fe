// 온보딩 7단계 — 추천 표현과 피드백을 맞추기 위해 배울 영어(억양)를 고른다
'use client';

import type { AccentLocale } from '@landit/analytics';

import { AccentForm } from '../common/AccentForm';

export const AccentStep = ({
  onNext,
}: {
  onNext: (locale: AccentLocale) => void;
}) => (
  <div className="flex min-h-0 flex-1 flex-col pt-7">
    <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
      어떤 영어로
      <br />
      배우고 싶으세요?
    </h1>
    <p className="mt-4 text-xl font-bold text-muted-foreground">
      추천 표현과 피드백이 달라져요
    </p>

    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <AccentForm
        footnote="배울 영어는 마이페이지에서 언제든 변경할 수 있어요"
        onConfirm={onNext}
      />
    </div>
  </div>
);
