'use client';

// 총평의 「이번 대화에서」 카드 — 영역 다섯 개를 100점 막대로 세우고 개선할 점을 붙인다. (i)는 점수가 무엇인지 알려 준다
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

import { InfoIcon } from '@/shared/ui/Icons';

import {
  SUMMARY_DOMAINS,
  type SummaryDomainRow,
} from '../../model/summary-level-card';

// 점수 글자가 설 자리를 뺀 나머지를 100점 막대의 전체 길이로 쓴다
const SCORE_LABEL_SPACE = '3.5rem';
// 0점이어도 자리가 비어 있음이 보이게 남기는 길이
const MIN_BAR = '0.75rem';

export const SummaryLevelCard = ({
  rows,
  improvement,
}: {
  rows: SummaryDomainRow[];
  improvement: string | null;
}) => (
  <section className="rounded-2xl bg-card px-5 py-4 shadow-sm">
    <div className="flex items-center justify-between">
      <h2 className="text-[14px] font-extrabold text-primary">이번 대화에서</h2>
      <ScoreInfo />
    </div>
    <dl className="mt-3 flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={row.key} className="flex flex-col gap-1.5">
          <dt className="text-[14px] text-muted-foreground">{row.label}</dt>
          <dd className="flex items-center gap-2.5">
            <span
              className="animate-bar-fill h-3 shrink-0 rounded-full bg-primary"
              style={
                {
                  '--bar-width': `max(${MIN_BAR}, calc((100% - ${SCORE_LABEL_SPACE}) * ${row.score / 100}))`,
                  '--i': index,
                } as CSSProperties
              }
            />
            <span className="text-[16px] font-extrabold text-primary tabular-nums">
              {row.score}점
            </span>
          </dd>
        </div>
      ))}
    </dl>
    {improvement && (
      <p className="mt-4 text-[14px] leading-[1.6] text-muted-foreground">
        {improvement}
      </p>
    )}
  </section>
);

/** 분석이 끝나기를 기다리는 동안 카드 자리를 잡아 둔다 */
export const SummaryLevelCardSkeleton = () => (
  <div
    role="status"
    aria-label="이번 대화 점수를 분석하고 있어요"
    className="animate-pulse rounded-2xl bg-card px-5 py-4 shadow-sm"
  >
    <div className="h-4 w-24 rounded bg-secondary" />
    <div className="mt-4 flex flex-col gap-4">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex flex-col gap-2">
          <div className="h-3 w-16 rounded bg-secondary" />
          <div className="h-3 w-full rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  </div>
);

const SCORE_INFO_TEXT =
  '이번 대화 한 번을 영역별로 살펴본 점수예요. 100점에 가까울수록 원어민처럼 자연스럽게 말했어요.';

// 툴팁 본문 — 점수가 무엇인지 한 줄, 그 아래 영역마다 무엇을 봤는지
const ScoreGuide = () => (
  <>
    <p>{SCORE_INFO_TEXT}</p>
    <dl className="mt-2 flex flex-col gap-1.5 border-t border-background/20 pt-2">
      {SUMMARY_DOMAINS.map(({ key, label, description }) => (
        <div key={key}>
          <dt className="font-bold">{label}</dt>
          <dd className="text-background/80">{description}</dd>
        </div>
      ))}
    </dl>
  </>
);

// (i) — 누르면 설명이 뜨고, 다시 누르거나 바깥을 누르면 닫힌다
const ScoreInfo = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="점수 설명"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="flex size-7 items-center justify-center text-muted-foreground active:opacity-60"
      >
        <InfoIcon size={16} />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="animate-fade-up absolute top-full right-0 z-10 mt-1 w-72 rounded-xl bg-foreground px-3.5 py-3 text-[13px] leading-5 text-background shadow-lg"
        >
          <ScoreGuide />
        </div>
      )}
    </div>
  );
};
