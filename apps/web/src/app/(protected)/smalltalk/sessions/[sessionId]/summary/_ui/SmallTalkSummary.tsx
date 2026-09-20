'use client';

// 오늘의 스몰톡 — 대화를 막 끝낸 자리에서 지난번과 무엇이 달라졌는지 보여준다. 점수도 별점도 없다.
// 래디 말풍선과 지난번과 비교 카드가 선다.
// 여기서 나가는 길은 둘 — 상세 피드백(대화 보기)을 거쳐 표현 학습으로, 또는 바로 표현 학습으로
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type { SmallTalkSummaryHeadline } from '@/features/small-talk/api/small-talk';
import { useSmallTalkSummaryQuery } from '@/features/small-talk/model/useSmallTalkSummaryQuery';
import { track } from '@/shared/analytics';
import {
  sessionExpressionBranchPath,
  smallTalkTranscriptPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { toPoseImage } from '../_model/randi-pose';
import { ComparisonCard } from './ComparisonCard';
import { SmallTalkSummarySkeleton } from './SmallTalkSummarySkeleton';

export const SmallTalkSummary = ({ sessionId }: { sessionId: number }) => {
  const router = useRouter();
  const { summary, error, isLoading, retry } =
    useSmallTalkSummaryQuery(sessionId);

  // 상세 피드백을 건너뛰고 표현 학습으로 — 닫기와 「다음에 볼게요」가 같은 곳으로 간다
  const goLearning = () =>
    router.replace(sessionExpressionBranchPath(sessionId, { celebrate: true }));
  // 상세 피드백(대화 보기)으로 — 그 화면이 표현 학습으로 이어 준다
  const goDetail = () =>
    router.replace(smallTalkTranscriptPath(sessionId, { next: 'learning' }));

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center justify-center">
        <button
          onClick={goLearning}
          className="absolute left-3 flex size-10 items-center justify-center text-foreground"
          aria-label="닫기"
        >
          <CloseIcon size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">오늘의 스몰톡</h1>
      </header>

      {error ? (
        <SummaryUnavailable
          message={error.message}
          onRetry={retry}
          onSkip={goLearning}
        />
      ) : isLoading || !summary ? (
        <SmallTalkSummarySkeleton />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-6">
            <Headline headline={summary.headline} />
            <ComparisonCard comparison={summary.comparison} />
          </div>

          <footer className="flex flex-none flex-col items-center gap-1 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
            <Button onClick={goDetail}>상세 피드백 보러가기</Button>
            {/* 첫 스몰톡은 상세 피드백을 반드시 거친다 — 건너뛸 길을 두지 않는다 */}
            {!summary.firstSession && (
              <button
                onClick={goLearning}
                className="py-2 text-sm font-semibold text-muted-foreground active:opacity-70"
              >
                다음에 볼게요
              </button>
            )}
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
    <div className="flex-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
      <p className="text-[15px] leading-6 font-bold break-keep text-foreground">
        {headline.text}
      </p>
      <p className="text-[15px] leading-6 font-bold break-keep text-foreground">
        {headline.subline}
      </p>
    </div>
  </div>
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
        track(EVENTS.ERROR_RETRIED, { screen: 'smalltalk' });
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
