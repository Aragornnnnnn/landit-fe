'use client';

// 오늘의 스몰톡 — 대화를 막 끝낸 자리에서 지난번과 무엇이 달라졌는지 보여준다. 점수도 별점도 없다.
// 래디 말풍선과 지난번과 비교 카드는 늘 서고, 그 아래 조건 블록(실수 기억·배운 표현 재사용·다음 스몰톡에서)이
// 있을 때만 쌓인다 — 어느 블록을 어떻게 그릴지는 summary-blocks가 정한다.
// 여기서 나가는 길은 둘 — 상세 피드백(대화 보기)을 거쳐 표현 학습으로, 또는 바로 표현 학습으로
import { useEffect, useEffectEvent, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type {
  SmallTalkSummaryHeadline,
  SmallTalkSummaryResponse,
} from '@/features/small-talk/api/small-talk';
import { toPoseImage } from '@/features/small-talk/model/randi-pose';
import { useSmallTalkSummaryQuery } from '@/features/small-talk/model/useSmallTalkSummaryQuery';
import { track } from '@/shared/analytics';
import {
  sessionExpressionBranchPath,
  smallTalkTranscriptPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import {
  FRESH_ARRIVALS,
  trackArrivals,
  type Arrivals,
} from '../_model/late-blocks';
import { toSummaryBlocks, type SummaryBlocks } from '../_model/summary-blocks';
import { BlockSkeleton } from './BlockSkeleton';
import { ComparisonCard } from './ComparisonCard';
import { FollowUpBlock } from './FollowUpBlock';
import { GrowthCard } from './GrowthCard';
import { ReusedExpressionsCard } from './ReusedExpressionsCard';
import { SmallTalkSummarySkeleton } from './SmallTalkSummarySkeleton';

export const SmallTalkSummary = ({ sessionId }: { sessionId: number }) => {
  const router = useRouter();
  const { summary, error, isLoading, waitExpired, retry } =
    useSmallTalkSummaryQuery(sessionId);
  // 총평은 이 세션의 교정이 다 끝나야 계산된다 — 보통 수 초지만, 상한까지 안 오면 붙잡아 두지 않는다
  const summaryStuck = summary !== null && summary.pending && waitExpired;

  // 화면이 실제로 선 뒤에만 블록의 도착을 센다 — 총평을 기다리는 동안은 전체가 스켈레톤이라 셀 것이 없다
  const blocks =
    summary && !summary.pending ? toSummaryBlocks(summary, waitExpired) : null;
  const [arrivals, setArrivals] = useState<Arrivals>(FRESH_ARRIVALS);
  const seenArrivals = blocks ? trackArrivals(arrivals, blocks) : arrivals;
  if (seenArrivals !== arrivals) setArrivals(seenArrivals);

  // 요약이 실제로 그려진 순간을 노출로 기록한다 — 그 순간 어떤 블록이 서 있었는지가 함께 실린다.
  // 이벤트로 감싸 폴링으로 요약이 갱신돼도 다시 찍지 않는다. 처음 선 그 순간이 노출이다.
  // 미리 받아 둔 요약으로 화면이 바로 서는 경우가 많아 표현·후속 질문은 아직 없을 때가 잦다 —
  // 그 "아직 없음"을 0건으로 세지 않도록 pending을 같이 싣는다
  // 교정을 기다리는 스켈레톤은 노출이 아니다 — 총평이 실제로 선 순간만 센다
  const shown = summary !== null && !summary.pending;
  const trackViewed = useEffectEvent(() => {
    if (
      !summary ||
      summary.firstSession === null ||
      summary.correctionCount === null
    )
      return;
    track(EVENTS.SMALL_TALK_SUMMARY_VIEWED, {
      session_id: sessionId,
      first_session: summary.firstSession,
      has_growth: summary.growth !== null,
      reused_expression_count: summary.reusedExpressions.items.length,
      reused_expressions_pending: summary.reusedExpressions.pending,
      follow_up_trigger: summary.followUp.triggerType,
      follow_up_pending: summary.followUp.pending,
      correction_count: summary.correctionCount,
    });
  });
  useEffect(() => {
    if (shown) trackViewed();
  }, [shown, sessionId]);

  // 이 화면을 떠나는 길은 한 번만 간다 — 다음 화면이 뜨기 전에 또 누르면 지표가 두 번 쌓인다.
  // 떠나기 시작하면 두 출구를 다 잠근다 (마이페이지 탈퇴 시트와 같은 처리)
  const [leaving, setLeaving] = useState(false);
  const leaveOnce = (to: string, record: () => void) => {
    if (leaving) return;
    setLeaving(true);
    record();
    router.replace(to);
  };

  // 상세 피드백을 건너뛰고 표현 학습으로 — 닫기(X)와 요약을 못 받았을 때의 출구가 여기로 간다.
  // 요약을 못 받은 채 나갈 수 있어 교정 개수는 null일 수 있다
  const skipDetail = (trigger: 'close' | 'unavailable') =>
    leaveOnce(sessionExpressionBranchPath(sessionId, { celebrate: true }), () =>
      track(EVENTS.SMALL_TALK_FEEDBACK_SKIPPED, {
        session_id: sessionId,
        trigger,
        correction_count: summary?.correctionCount ?? null,
      }),
    );
  // 상세 피드백(대화 보기)으로 — 그 화면이 표현 학습으로 이어 준다. 요약이 선 뒤에만 누를 수 있다
  const openDetail = (shownSummary: SmallTalkSummaryResponse) =>
    leaveOnce(smallTalkTranscriptPath(sessionId, { next: 'learning' }), () =>
      track(EVENTS.SMALL_TALK_FEEDBACK_OPENED, {
        session_id: sessionId,
        correction_count: shownSummary.correctionCount,
      }),
    );

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center justify-center">
        <button
          onClick={() => skipDetail('close')}
          disabled={leaving}
          className="absolute left-3 flex size-10 items-center justify-center text-foreground"
          aria-label="닫기"
        >
          <CloseIcon size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">오늘의 스몰톡</h1>
      </header>

      {error || summaryStuck ? (
        <SummaryUnavailable
          message={error?.message ?? '오늘의 스몰톡을 정리하지 못했어요.'}
          onRetry={retry}
          onSkip={() => skipDetail('unavailable')}
        />
      ) : isLoading || !summary || !summary.headline || !summary.comparison ? (
        <SmallTalkSummarySkeleton />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-6">
            <Headline headline={summary.headline} />
            <ComparisonCard comparison={summary.comparison} />
            {blocks && (
              <ConditionalBlocks blocks={blocks} arrivals={seenArrivals} />
            )}
          </div>

          {/* 나가는 길은 이 버튼 하나 — 건너뛰는 링크를 따로 두지 않는다.
              상세 피드백을 보고 나면 그 화면이 표현 학습으로 이어 준다 */}
          <footer className="flex-none px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
            <Button onClick={() => openDetail(summary)} disabled={leaving}>
              상세 피드백 보러갈게요
            </Button>
          </footer>
        </>
      )}
    </main>
  );
};

// 래디와 회색 말풍선 두 줄 — 지난번 대비 가장 좋아진 것 하나를 사실(숫자)과 의미로 말한다
const Headline = ({ headline }: { headline: SmallTalkSummaryHeadline }) => (
  <div className="flex items-center gap-3">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={toPoseImage(headline.pose)}
      alt=""
      className="size-20 shrink-0 object-contain"
    />
    {/* 첫 문장엔 닉네임이 들어갈 수 있고 길이 제한이 없다 — 띄어쓰기 없는 긴 이름도 풍선 안에서 끊는다 */}
    <div className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 [overflow-wrap:anywhere]">
      <p className="text-[15px] leading-6 font-bold break-keep text-foreground">
        {headline.text}
      </p>
      <p className="text-[15px] leading-6 font-bold break-keep text-foreground">
        {headline.subline}
      </p>
    </div>
  </div>
);

// 조건 블록 셋 — 상태별로 카드·스켈레톤·없음. 순서는 실수 기억 → 배운 표현 → 다음 스몰톡
// 스켈레톤을 거쳐 온 블록만 떠오르게 한다 — 처음부터 서 있던 블록은 그냥 그린다
const risingIn = (arrival: Arrivals[keyof Arrivals]) =>
  arrival === 'late' ? 'animate-fade-up' : '';

const ConditionalBlocks = ({
  blocks,
  arrivals,
}: {
  blocks: SummaryBlocks;
  arrivals: Arrivals;
}) => (
  <>
    {blocks.growth.kind === 'ready' && (
      <GrowthCard
        growth={blocks.growth.data}
        className={risingIn(arrivals.growth)}
      />
    )}
    {blocks.reusedExpressions.kind === 'ready' && (
      <ReusedExpressionsCard
        items={blocks.reusedExpressions.data}
        className={risingIn(arrivals.reusedExpressions)}
      />
    )}
    {blocks.reusedExpressions.kind === 'loading' && (
      <BlockSkeleton label="배운 표현 재사용을 찾는 중" />
    )}
    {blocks.followUp.kind === 'ready' && (
      <FollowUpBlock
        followUp={blocks.followUp.data}
        className={risingIn(arrivals.followUp)}
      />
    )}
    {blocks.followUp.kind === 'loading' && (
      <BlockSkeleton label="다음 스몰톡 질문을 찾는 중" />
    )}
  </>
);

// 요약을 못 받았을 때 — 다시 물어보거나, 요약 없이 표현 학습으로 넘어간다 (대화는 이미 끝났다)
const SummaryUnavailable = ({
  message,
  onRetry,
  onSkip,
}: {
  message: string;
  onRetry: () => void;
  onSkip: () => void;
}) => (
  <div
    role="alert"
    className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
  >
    <p className="text-sm text-muted-foreground">
      {message || '오늘의 스몰톡을 불러오지 못했어요.'}
    </p>
    <Button
      variant="secondary"
      size="sm"
      className="w-auto px-6"
      onClick={() => {
        track(EVENTS.ERROR_RETRIED, { screen: 'smalltalk_summary' });
        onRetry();
      }}
    >
      다시 시도
    </Button>
    <button
      onClick={onSkip}
      className="py-1 text-sm font-semibold text-muted-foreground active:opacity-70"
    >
      표현 배우러 가기
    </button>
  </div>
);
