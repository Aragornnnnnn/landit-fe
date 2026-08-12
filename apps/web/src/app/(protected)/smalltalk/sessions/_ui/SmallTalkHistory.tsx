'use client';

// 지난 스몰톡 — 완료한 대화가 최신순으로 선다. 누르면 그때 만든 표현을 다시 본다.
// 시나리오처럼 날짜로 찾아가는 화면이 아니다 — 스몰톡은 대화 자체가 기록의 단위다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type { SmallTalkSessionSummary } from '@/features/small-talk/api/small-talk';
import {
  toDayLabel,
  toSessionTitle,
} from '@/features/small-talk/lib/session-summary';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import { useSmallTalkSessionsQuery } from '@/features/small-talk/model/useSmallTalkSessionsQuery';
import { track } from '@/shared/analytics';
import { SMALLTALK_PATH, smallTalkHistoryPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/Icons';

export const SmallTalkHistory = () => {
  const router = useRouter();
  const { sessions, error, retry } = useSmallTalkSessionsQuery();

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center justify-center">
        <button
          onClick={() => router.replace(SMALLTALK_PATH)}
          className="absolute left-3 flex size-10 items-center justify-center text-foreground"
          aria-label="뒤로"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-foreground">지난 스몰톡</h1>
      </header>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message || '지난 대화를 불러오지 못했어요.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-auto px-6"
            onClick={() => {
              track(EVENTS.ERROR_RETRIED, { screen: 'smalltalk' });
              retry();
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : sessions === null ? (
        // 조회 중 — 안내 문구만 덩그러니 두면 목록이 빈 것처럼 읽힌다
        <div className="flex-1" />
      ) : sessions.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm break-keep whitespace-pre-line text-muted-foreground">
          {'아직 나눈 대화가 없어요.\n오늘 한 대화부터 여기 쌓여요.'}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
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
  <button
    onClick={onSelect}
    className="flex w-full items-center gap-3 rounded-2xl bg-card px-4.5 py-4 text-left shadow-sm transition-colors active:bg-secondary/40"
  >
    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-bold text-foreground">
        {toSessionTitle(session.title, session.completedAt)}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        {toDayLabel(session.completedAt)} ·{' '}
        {toSpeakingTimeLabel(session.userSpeakingDurationMs)}
      </p>
    </div>
    <ExpressionProgress
      done={session.completedExpressionCount}
      total={session.expressionCount}
    />
    <ChevronRightIcon size={16} className="text-muted-foreground/60" />
  </button>
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
    <span className={`shrink-0 text-[13px] font-semibold ${tone}`}>
      표현 {done}/{total}
    </span>
  );
};
