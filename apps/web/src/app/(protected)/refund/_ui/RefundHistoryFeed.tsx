'use client';

// 내 환급 내역 — 늦은 것부터 보여 주고, 끝까지 내리면 이전 내역을 이어 받는다
import { useEffect, useEffectEvent } from 'react';

import type { HistoryRow } from '@/features/reward/model/reward-history';
import {
  useRewardHistoryQuery,
  type RewardHistoryState,
} from '@/features/reward/model/useRewardHistoryQuery';
import {
  HistoryPlaceholderLines,
  RefundHistory,
} from '@/features/reward/ui/RefundHistory';
import { useInView } from '@/shared/lib/useInView';

const NOTICE_CLASS =
  'py-6 text-center text-[13px] font-medium text-muted-foreground';

export const RefundHistoryFeed = () => (
  <RefundHistoryList {...useRewardHistoryQuery()} />
);

// 그리는 쪽 — 어디서 받아 왔는지는 모른다
export const RefundHistoryList = ({
  rows,
  error,
  retry,
  hasMore,
  fetching,
  loadingMore,
  moreFailed,
  loadMore,
}: RewardHistoryState) => {
  const { ref: nearEndRef, inView: nearEnd } = useInView<HTMLDivElement>(
    undefined,
    { once: false },
  );

  // 끝이 가까운 동안 다음 장을 받는다 — 줄이 늘지 않아도(전부 걸러진 장) 끝이 그대로 가까우면 이어 받고, 실패하면 스스로 다시 묻지 않는다
  const shouldLoadMore = nearEnd && hasMore && !fetching && !moreFailed;
  const loadNext = useEffectEvent(loadMore);
  useEffect(() => {
    if (shouldLoadMore) loadNext();
  }, [shouldLoadMore]);

  return (
    <section aria-label="환급 내역" className="relative mt-3 px-5">
      <HistoryBody
        rows={rows}
        hasMore={hasMore}
        // 다시 받는 동안에는 실패 문구를 걷는다 — 눌렀는데 그대로면 안 눌린 줄 안다
        failed={error !== null && !fetching}
        onRetry={retry}
      />

      {/* 알림 자리는 늘 두고 안의 글자만 바꾼다 — 새로 생긴 알림 자리는 읽어 주지 않는 낭독기가 있다 */}
      <div role="status" aria-live="polite">
        {loadingMore && (
          <p
            className={`flex items-center justify-center gap-2 ${NOTICE_CLASS}`}
          >
            <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
            내역을 불러오고 있어요
          </p>
        )}
      </div>
      {moreFailed && !loadingMore && (
        <RetryLine message="이전 내역을 불러오지 못했어요" onRetry={loadMore} />
      )}
      {/* 끝에 닿기 조금 전을 알리는 자리 — 마지막 줄을 본 뒤에야 받으면 기다림이 보인다.
          스크롤하는 곳이 화면 전체가 아니라 안쪽 상자라 관찰 범위를 넓혀도 먹지 않는다. 그래서 자리 자체를 끝에서 위로 길게 둔다 */}
      {hasMore && (
        <div
          ref={nearEndRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-60"
        />
      )}
    </section>
  );
};

const HistoryBody = ({
  rows,
  hasMore,
  failed,
  onRetry,
}: {
  // 첫 장을 아직 못 받았으면 null
  rows: HistoryRow[] | null;
  hasMore: boolean;
  failed: boolean;
  onRetry: () => void;
}) => {
  if (rows !== null) {
    // 줄이 없어도 받을 장이 남았으면 비었다고 말하지 않는다 — 받은 장이 전부 걸러졌을 뿐이다
    if (rows.length === 0 && !hasMore)
      return <p className={NOTICE_CLASS}>아직 내역이 없어요</p>;
    return <RefundHistory history={rows} />;
  }
  if (failed)
    return <RetryLine message="내역을 불러오지 못했어요" onRetry={onRetry} />;
  // 첫 장을 받는 중 — 줄이 놓일 자리를 먼저 잡는다
  return (
    <div role="status" aria-label="환급 내역을 불러오는 중">
      <HistoryPlaceholderLines />
    </div>
  );
};

// 쌓인 금액은 위에 그대로 보이니 화면을 통째로 바꾸지 않고 한 줄로만 알린다
const RetryLine = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <p className={NOTICE_CLASS}>
    {message}
    <button
      type="button"
      onClick={onRetry}
      className="ml-2 font-bold text-primary underline underline-offset-4"
    >
      다시 시도
    </button>
  </p>
);
