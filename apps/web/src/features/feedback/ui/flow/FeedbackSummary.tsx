'use client';

// 피드백 총평 — 별점·헤드라인·점수 트랙·성공률 아래로 총평, 영역 점수, 지난번과의 비교, 배운 표현 카드를 쌓고 상세로 넘긴다
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon, LockIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import type { SessionFeedbackResponse } from '../../api/session-feedback';
import {
  detailCtaLabel,
  LOCKED_DETAIL_CTA_LABEL,
} from '../../model/feedback-view';
import { useSummaryLevelCard } from '../../model/useSummaryLevelCard';
import { GrowthCard } from '../GrowthCard';
import {
  REUSED_EXPRESSIONS_TITLE,
  ReusedExpressionsCard,
} from '../ReusedExpressionsCard';
import { ScoreTrack } from './ScoreTrack';
import { SummaryLevelCard, SummaryLevelCardSkeleton } from './SummaryLevelCard';

export const FeedbackSummary = ({
  feedback,
  title,
  detailLocked,
  refreshing = false,
  onBack,
  onDetail,
}: {
  feedback: SessionFeedbackResponse;
  title: string;
  /** 서버가 상세를 잠근 세션 — 턴별 피드백이 비어 와서 성공률을 셀 수 없고, CTA는 페이월로 이어진다 */
  detailLocked: boolean;
  /** 잠긴 응답을 다시 받는 중 — CTA를 돌려 기다리게 한다 */
  refreshing?: boolean;
  onBack: () => void;
  onDetail: () => void;
}) => {
  const levelCard = useSummaryLevelCard(feedback);
  const goodCount = feedback.messageFeedbacks.filter(
    (item) => item.feedbackType === 'GOOD',
  ).length;
  const total = feedback.messageFeedbacks.length;

  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="flex items-center gap-2 border-b border-border px-4 pt-4 pb-3"
        style={{ paddingTop: 'max(var(--safe-area-inset-top), 16px)' }}
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

      <div className="flex-1 overflow-y-auto px-6 pt-[18px] pb-6">
        {/* 별점 → 헤드라인(시나리오×별점 문구) → 원어민 이해도 % */}
        <div className="flex flex-col gap-[7px]">
          <StarRating rating={feedback.starRating} size={32} animate />
          <p className="text-[23px] leading-[1.28] font-bold break-keep text-foreground">
            {feedback.highlightMessage}
          </p>
        </div>

        <div className="mt-[18px]">
          <ScoreTrack score={feedback.nativeScore} />
        </div>

        {!detailLocked && (
          <p className="mt-5 text-base font-semibold text-foreground">
            {total}번 중 <span className="text-primary">{goodCount}번</span>{' '}
            원어민처럼 말했어요
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <SummaryCard title="총평">
            <p className="text-[15px] leading-[1.6] text-foreground">
              {feedback.summaryMessage}
            </p>
          </SummaryCard>

          {levelCard.kind === 'loading' && <SummaryLevelCardSkeleton />}
          {levelCard.kind === 'ready' && (
            <SummaryLevelCard
              rows={levelCard.rows}
              improvement={levelCard.improvement}
            />
          )}

          <GrowthSection growth={feedback.growthFeedback} />
          <ReuseSection reuse={feedback.expressionReuse} />
        </div>
      </div>

      {/* 카드가 길어져도 CTA는 늘 아래에 선다 */}
      <div
        className="px-6 pt-3"
        style={{ paddingBottom: 'max(var(--safe-area-inset-bottom), 8px)' }}
      >
        <Button
          onClick={onDetail}
          loading={detailLocked && refreshing}
          // 자물쇠는 장식이라 읽어 주지 않는다 — 잠겼다는 것과 어디로 가는지를 이름에 담는다
          aria-label={
            detailLocked ? '상세 피드백 보기. 결제 화면으로 갑니다' : undefined
          }
        >
          {detailLocked ? (
            <>
              <LockIcon size={18} />
              {LOCKED_DETAIL_CTA_LABEL}
            </>
          ) : (
            detailCtaLabel(total - goodCount)
          )}
        </Button>
      </div>
    </div>
  );
};

// 지난번과의 비교 — 필드가 없는 구버전 응답(undefined)은 비교를 안 한 것이라 빈 문구도 띄우지 않는다
const GrowthSection = ({
  growth,
}: {
  growth: SessionFeedbackResponse['growthFeedback'];
}) => {
  if (growth === undefined) return null;
  if (growth) return <GrowthCard growth={growth} />;
  return (
    // TODO: 제품 확정 카피로 교체. 비교할 패턴이 없어 시안의 「과거형」 자리를 일반 이름으로 둔다
    <SummaryCard title="지난번엔 헷갈렸던 실수">
      <EmptyText>아직 지난 기록이 없어요</EmptyText>
    </SummaryCard>
  );
};

// 배운 표현 재사용 — 구버전 응답이거나 분석 중(pending)이면 거둔다. 총평은 POST로 한 번 만들어 다시 물을 수 없다
const ReuseSection = ({
  reuse,
}: {
  reuse: SessionFeedbackResponse['expressionReuse'];
}) => {
  if (!reuse || reuse.pending) return null;
  if (reuse.items.length > 0)
    return <ReusedExpressionsCard items={reuse.items} />;
  return (
    <SummaryCard title={REUSED_EXPRESSIONS_TITLE}>
      <EmptyText className="border-t border-border pt-3">
        아직 배운 표현이 없어요
      </EmptyText>
    </SummaryCard>
  );
};

// 총평 화면의 카드 껍데기 — 성장·배운 표현 카드와 같은 모양
const SummaryCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl bg-card px-5 py-4 shadow-sm">
    <h2 className="text-[14px] font-extrabold text-primary">{title}</h2>
    <div className="mt-2">{children}</div>
  </section>
);

const EmptyText = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <p className={`text-[15px] text-muted-foreground ${className}`}>{children}</p>
);
