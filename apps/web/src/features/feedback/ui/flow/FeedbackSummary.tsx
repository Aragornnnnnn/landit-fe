'use client';

// 피드백 총평 — 별점·헤드라인·점수 트랙·성공률 아래로 총평, 영역 점수, 지난번과의 비교, 배운 표현 카드를 쌓고 상세로 넘긴다
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon, LockIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import type { SessionFeedbackResponse } from '../../api/session-feedback';
import { useMoreBelow } from '../../lib/useMoreBelow';
import { summaryHeadline } from '../../model/feedback-view';
import { useSummaryLevelCard } from '../../model/useSummaryLevelCard';
import { GrowthCard } from '../GrowthCard';
import { ReusedExpressionsCard } from '../ReusedExpressionsCard';
import { ScoreTrack } from './ScoreTrack';
import { SummaryLevelCard, SummaryLevelCardSkeleton } from './SummaryLevelCard';

export const FeedbackSummary = ({
  feedback,
  title,
  detailLocked,
  premium,
  refreshing = false,
  onBack,
  onDetail,
}: {
  feedback: SessionFeedbackResponse;
  title: string;
  /** 서버가 상세를 잠근 세션 — 턴별 피드백이 비어 와서 성공률을 셀 수 없고, CTA는 페이월로 이어진다 */
  detailLocked: boolean;
  /** 유료 구독 중인가 — 배운 표현 카드의 빈 문구를 고른다 */
  premium: boolean;
  /** 잠긴 응답을 다시 받는 중 — CTA를 돌려 기다리게 한다 */
  refreshing?: boolean;
  onBack: () => void;
  onDetail: () => void;
}) => {
  const t = useTranslations('feedback.feedbackSummary');
  // 남은 개선 턴이 있으면 걸음 수로, 없으면 잘한 점을 보라고 부른다
  const improveOrReview = (improvementCount: number) =>
    improvementCount > 0
      ? t('improveButton', { count: improvementCount })
      : t('reviewButton');
  const levelCard = useSummaryLevelCard(feedback);
  const { ref: scrollRef, onScroll, moreBelow } = useMoreBelow();
  const goodCount = feedback.messageFeedbacks.filter(
    (item) => item.feedbackType === 'GOOD',
  ).length;
  const total = feedback.messageFeedbacks.length;
  const completedBefore = feedback.hasPreviousSameScenarioCompletion ?? false;

  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="flex items-center gap-2 border-b border-border px-4 pt-4 pb-3"
        style={{ paddingTop: 'max(var(--safe-area-inset-top), 16px)' }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label={t('closeButton')}
          className="flex h-7 w-[21px] items-center justify-center text-muted-foreground active:opacity-60"
        >
          <ChevronLeftIcon size={24} strokeWidth={2.4} />
        </button>
        <p className="flex-1 truncate text-center text-lg font-bold text-foreground">
          {title}
        </p>
        <span className="w-7" />
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto px-6 pt-[18px] pb-6"
        >
          {/* 별점 → 헤드라인(시나리오×별점 문구) → 원어민 이해도 % */}
          <div className="flex flex-col gap-[7px]">
            <StarRating rating={feedback.starRating} size={32} animate />
            <p className="text-23 leading-[1.28] font-bold break-keep text-foreground">
              {summaryHeadline(feedback.highlightMessage) ?? t('fallbackTitle')}
            </p>
          </div>

          <div className="mt-[18px]">
            <ScoreTrack score={feedback.nativeScore} />
          </div>

          {!detailLocked && (
            <p className="mt-5 text-base font-semibold text-foreground">
              {t.rich('successBody', {
                total,
                good: goodCount,
                emphasis: (chunks) => (
                  <span className="text-primary">{chunks}</span>
                ),
              })}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <SummaryCard title={t('overallTitle')}>
              <p className="text-15 leading-[1.6] text-foreground">
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

            <GrowthSection
              growth={feedback.growthFeedback}
              completedBefore={completedBefore}
            />
            <ReuseSection
              reuse={feedback.expressionReuse}
              completedBefore={completedBefore}
              premium={premium}
            />
          </div>
        </div>
        {/* 버튼 위로 가려진 카드가 더 있으면 아래 가장자리를 흐린다 — 끝까지 내리면 걷힌다 */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-background backdrop-blur-[3px] transition-opacity duration-200 ${moreBelow ? 'opacity-100' : 'opacity-0'}`}
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black)',
          }}
        />
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
          aria-label={detailLocked ? t('lockedDetailLabel') : undefined}
        >
          {/* 서버가 상세를 잠근 세션은 턴 수를 몰라 걸음 수 문구 대신 잠금 문구를 쓴다 */}
          {detailLocked ? (
            <>
              <LockIcon size={18} />
              {t('lockedDetailButton')}
            </>
          ) : (
            improveOrReview(total - goodCount)
          )}
        </Button>
      </div>
    </div>
  );
};

// 지난번과의 비교 — 필드가 없는 구버전 응답(undefined)은 비교를 안 한 것이라 빈 문구도 띄우지 않는다
const GrowthSection = ({
  growth,
  completedBefore,
}: {
  growth: SessionFeedbackResponse['growthFeedback'];
  completedBefore: boolean;
}) => {
  const t = useTranslations('feedback.feedbackSummary');
  if (growth === undefined) return null;
  if (growth) return <GrowthCard growth={growth} />;
  return (
    // 비교할 패턴이 없어도 시안 제목 그대로 둔다 (2026-09-30 확정)
    <SummaryCard title={t('growthEmptyTitle')}>
      <EmptyText>
        {completedBefore ? t('growthEmptyRetryBody') : t('growthEmptyBody')}
      </EmptyText>
    </SummaryCard>
  );
};

// 배운 표현 재사용 — 구버전 응답이거나 분석 중(pending)이면 거둔다. 총평은 POST로 한 번 만들어 다시 물을 수 없다
const ReuseSection = ({
  reuse,
  completedBefore,
  premium,
}: {
  reuse: SessionFeedbackResponse['expressionReuse'];
  completedBefore: boolean;
  premium: boolean;
}) => {
  const t = useTranslations('feedback.feedbackSummary');
  const reuseT = useTranslations('feedback.reusedExpressionsCard');
  if (!reuse || reuse.pending) return null;
  if (reuse.items.length > 0)
    return <ReusedExpressionsCard items={reuse.items} />;
  return (
    // 무료 유저는 재도전이어도 처음 문구를 그대로 쓴다 (2026-10-28 확정)
    <SummaryCard title={reuseT('title')}>
      <EmptyText>
        {completedBefore && premium
          ? t('reuseEmptyRetryBody')
          : t('reuseEmptyBody')}
      </EmptyText>
    </SummaryCard>
  );
};

// 총평 화면의 카드 껍데기 — 성장·배운 표현 카드와 같은 모양. 환급 페이월의 피드백 미리보기도 쓴다
export const SummaryCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl bg-card px-5 py-4 shadow-sm">
    <h2 className="text-14 font-extrabold text-primary">{title}</h2>
    <div className="mt-2">{children}</div>
  </section>
);

const EmptyText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-15 text-muted-foreground">{children}</p>
);
