'use client';

// 설문 상단 — 뒤로가기와 진행 막대. 문항이 열 개가 넘어 점 대신 막대와 "3/12"로 보여준다
import { ChevronLeftIcon } from '@/shared/ui/Icons';

export const SurveyHeader = ({
  questionIndex,
  questionCount,
  onBack,
}: {
  // 안내 화면처럼 문항이 아닐 땐 null — 진행 막대를 감춘다
  questionIndex: number | null;
  questionCount: number;
  onBack: () => void;
}) => (
  <header
    className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5"
    style={{ paddingTop: 'max(env(safe-area-inset-top), 18px)' }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="이전"
      className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-opacity active:bg-black/5"
    >
      <ChevronLeftIcon size={28} strokeWidth={2.8} />
    </button>

    {questionIndex !== null && (
      <div className="flex items-center gap-2.5">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-300"
            style={{ width: `${((questionIndex + 1) / questionCount) * 100}%` }}
          />
        </div>
        <span className="text-[13px] font-bold text-muted-foreground tabular-nums">
          {questionIndex + 1}/{questionCount}
        </span>
      </div>
    )}
  </header>
);
