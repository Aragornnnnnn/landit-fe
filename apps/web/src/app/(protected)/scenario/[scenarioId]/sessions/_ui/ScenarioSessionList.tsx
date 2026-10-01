'use client';

// 시나리오 기록 — 그 시나리오를 완료한 회차가 최신순으로 선다. 누르면 그때 받은 피드백을 다시 본다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { useScenarioTitle } from '@/features/scenario/model/useScenarioTitle';
import { track } from '@/shared/analytics';
import { scenarioReturnPath, scenarioSessionPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import { toSessionRows, type SessionRow } from '../_model/session-rows';
import { useScenarioHistoryQuery } from '../_model/useScenarioHistoryQuery';

export const ScenarioSessionList = ({
  scenarioId,
  date,
}: {
  scenarioId: number;
  // 어느 날 카드에서 들어왔는지 — 나갈 때 그 날로 돌아가고, 회차로 이어 나른다
  date?: string;
}) => {
  const router = useRouter();
  const title = useScenarioTitle(scenarioId, date, '지난 대화');
  const { sessions, error, retry } = useScenarioHistoryQuery(scenarioId);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center justify-center px-14">
        <button
          onClick={() => router.replace(scenarioReturnPath({ date }))}
          className="absolute left-3 flex size-10 items-center justify-center text-foreground"
          aria-label="뒤로"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 className="truncate text-[17px] font-bold text-foreground">
          {title}
        </h1>
      </header>

      {/* 받아 둔 기록이 있으면 다시 받다 실패해도 목록을 그대로 둔다 */}
      {sessions === null && error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message || '지난 대화를 불러오지 못했어요.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-auto px-6"
            onClick={() => {
              track(EVENTS.ERROR_RETRIED, { screen: 'scenario_history' });
              retry();
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : sessions === null ? (
        <SessionListSkeleton />
      ) : sessions.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm break-keep whitespace-pre-line text-muted-foreground">
          {'아직 마친 대화가 없어요.\n대화를 마치면 여기 쌓여요.'}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <p className="pt-2 pb-4 text-sm text-muted-foreground">
            대화를 누르면 그때 받은 피드백을 다시 볼 수 있어요.
          </p>
          <ul className="flex flex-col gap-2">
            {toSessionRows(sessions).map((row) => (
              <li key={row.sessionId}>
                <SessionRowButton
                  row={row}
                  onSelect={() =>
                    router.push(
                      scenarioSessionPath(scenarioId, row.sessionId, { date }),
                    )
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

// 한 줄에 담기는 건 셋 — 몇 번째 대화였는지, 언제였는지, 그때 점수
const SessionRowButton = ({
  row,
  onSelect,
}: {
  row: SessionRow;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className="flex w-full items-center gap-3 rounded-2xl bg-card px-4.5 py-4 text-left shadow-sm transition-colors active:bg-secondary/40"
  >
    <div className="min-w-0 flex-1">
      <p className="text-base font-bold text-foreground">
        {row.ordinal}번째 대화
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
        {row.dayLabel}
        {row.score && ` · 원어민 이해도 ${row.score.nativeScore}%`}
      </p>
    </div>
    {row.score ? (
      <StarRating rating={row.score.starRating} size={16} />
    ) : (
      <span className="shrink-0 text-[13px] font-semibold text-muted-foreground">
        피드백 없음
      </span>
    )}
    <ChevronRightIcon size={16} className="text-muted-foreground/60" />
  </button>
);

// 조회 중 — 빈 화면만 두면 목록이 비었는지 아직인지 알 수 없다
const SessionListSkeleton = () => (
  <div
    role="status"
    aria-label="지난 대화를 불러오는 중"
    className="min-h-0 flex-1 animate-pulse overflow-hidden px-5 pb-6"
  >
    <div className="mt-2 mb-4 h-5 w-3/4 rounded bg-secondary" />
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3 rounded-2xl bg-card px-4.5 py-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="h-6 w-1/3 rounded bg-secondary" />
            <div className="mt-1.5 h-[18px] w-1/2 rounded bg-secondary" />
          </div>
          <div className="h-4 w-14 shrink-0 rounded bg-secondary" />
        </div>
      ))}
    </div>
  </div>
);
