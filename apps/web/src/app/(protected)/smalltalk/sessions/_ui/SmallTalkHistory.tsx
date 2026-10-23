'use client';

// 지난 스몰톡 — 완료한 대화가 최신순으로 선다. 누르면 그때 만든 표현을 다시 본다.
// 시나리오처럼 날짜로 찾아가는 화면이 아니다 — 스몰톡은 대화 자체가 기록의 단위다
import { useRouter } from 'next/navigation';

import {
  HistoryListSkeleton,
  HistoryRow,
} from '@/app/(protected)/_ui/HistoryRow';
import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import type { SmallTalkSessionSummary } from '@/features/small-talk/api/small-talk';
import { toSessionTitle } from '@/features/small-talk/lib/session-summary';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkSessionsQuery } from '@/features/small-talk/model/useSmallTalkSessionsQuery';
import { toDayLabel } from '@/shared/lib/day-label';
import { SMALLTALK_PATH, smallTalkHistoryPath } from '@/shared/lib/routes';
import { LoadMoreButton } from '@/shared/ui/LoadMoreButton';
import { RetryNotice } from '@/shared/ui/RetryNotice';

export const SmallTalkHistory = () => {
  const router = useRouter();
  const { sessions, error, retry, hasMore, loadingMore, loadMore } =
    useSmallTalkSessionsQuery();

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <PageHeader
        title="지난 스몰톡"
        onBack={() => router.replace(SMALLTALK_PATH)}
      />

      {error ? (
        <RetryNotice
          fill
          screen="smalltalk"
          message={error.message || '지난 대화를 불러오지 못했어요.'}
          onRetry={retry}
        />
      ) : sessions === null ? (
        // 조회 중 — 빈 화면만 두면 목록이 비었는지 아직인지 알 수 없다
        <HistoryListSkeleton rows={4} label="지난 대화를 불러오는 중" />
      ) : sessions.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm break-keep whitespace-pre-line text-muted-foreground">
          {'아직 나눈 대화가 없어요.\n오늘 한 대화부터 여기 쌓여요.'}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(var(--safe-area-inset-bottom),24px)]">
          <p className="pt-2 pb-4 text-sm text-muted-foreground">
            대화를 누르면 그때 만든 표현을 다시 볼 수 있어요.
          </p>
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <SessionRow
                  session={session}
                  onSelect={() =>
                    router.push(smallTalkHistoryPath(session.sessionId))
                  }
                />
              </li>
            ))}
          </ul>

          {/* 쌓이면 첫 장 밖으로 밀린다 — 옛 대화도 이어서 볼 수 있게 한다.
              편지함 목록과 같은 모양으로, 목록의 마지막 한 줄처럼 읽히게 한다 */}
          {hasMore && (
            <LoadMoreButton loading={loadingMore} onClick={loadMore} />
          )}
        </div>
      )}
    </main>
  );
};

// 한 줄에 담기는 건 셋 — 무슨 얘기였는지, 언제 얼마나 했는지, 표현을 얼마나 배웠는지
const SessionRow = ({
  session,
  onSelect,
}: {
  session: SmallTalkSessionSummary;
  onSelect: () => void;
}) => (
  <HistoryRow
    onClick={onSelect}
    title={toSessionTitle(session.title, session.completedAt)}
    meta={`${toDayLabel(session.completedAt)} · ${toSpeakingTimeLabel(session.userSpeakingDurationMs)}`}
    trailing={
      <ExpressionProgress
        done={session.completedExpressionCount}
        total={session.expressionCount}
      />
    }
  />
);

// 다 배웠으면 초록, 남았으면 주황, 아직 하나도 안 했으면 회색 — 색만으로 남은 게 있는지 읽힌다.
// 표현이 아직 안 만들어졌으면 셀 것이 없다
const ExpressionProgress = ({
  done,
  total,
}: {
  done: number;
  total: number;
}) => {
  if (total === 0) return null;

  const tone =
    done === total
      ? 'text-success'
      : done === 0
        ? 'text-muted-foreground'
        : 'text-primary';

  return (
    <span className={`shrink-0 text-13 font-semibold ${tone}`}>
      표현 {done}/{total}
    </span>
  );
};
