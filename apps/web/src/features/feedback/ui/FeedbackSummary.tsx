'use client';

// 피드백 총평 — 별점·해석·점수 트랙·이번 대화 요약을 한 화면에 모아 상세로 넘긴다
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import type { SessionFeedbackResponse } from '../api/session-feedback';
import { deliveryInterpretation, detailCtaLabel } from '../model/feedback-view';
import { ScoreTrack } from './ScoreTrack';

export const FeedbackSummary = ({
  feedback,
  title,
  onBack,
  onDetail,
}: {
  feedback: SessionFeedbackResponse;
  title: string;
  onBack: () => void;
  onDetail: () => void;
}) => {
  const goodCount = feedback.messageFeedbacks.filter(
    (item) => item.feedbackType === 'GOOD',
  ).length;
  const total = feedback.messageFeedbacks.length;

  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="flex items-center gap-2 border-b border-border px-4 pt-4 pb-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="닫기"
          className="flex h-7 w-[21px] items-center justify-center text-muted-foreground active:opacity-60"
        >
          <ChevronLeftIcon size={24} strokeWidth={2.4} />
        </button>
        <p className="flex-1 truncate text-center text-lg font-bold text-foreground">
          {title}
        </p>
        <span className="w-7" />
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-[18px] pb-6">
        {/* 별점 → 해석 헤드라인 → 원어민 이해도 % */}
        <div className="flex flex-col gap-[7px]">
          <StarRating rating={feedback.starRating} size={32} animate />
          <p className="text-[23px] leading-[1.28] font-bold text-foreground">
            {feedback.summaryMessage}
          </p>
        </div>

        <div className="mt-[18px]">
          <ScoreTrack score={feedback.nativeScore} />
        </div>

        <p className="mt-8 mb-3 text-xl font-bold text-foreground">
          이번 대화에서
        </p>
        <div className="divide-y divide-primary/10 rounded-2xl bg-primary/[0.06]">
          <CardRow label="전달력">
            {deliveryInterpretation(feedback.nativeScore)}
          </CardRow>
          <CardRow label="대화 성공률">
            {total}번 중 <span className="text-primary">{goodCount}번</span>{' '}
            원어민처럼 말했어요
          </CardRow>
          {feedback.highlightMessage && (
            <CardRow label="발견한 강점">{feedback.highlightMessage}</CardRow>
          )}
        </div>

        <div
          className="mt-auto pt-8"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        >
          <Button onClick={onDetail}>
            {detailCtaLabel(total - goodCount)}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CardRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 px-5 py-3.5">
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    <p className="text-base leading-[1.35] font-semibold text-foreground">
      {children}
    </p>
  </div>
);
