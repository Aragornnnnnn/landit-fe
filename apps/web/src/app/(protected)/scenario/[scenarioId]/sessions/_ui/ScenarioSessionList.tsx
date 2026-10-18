'use client';

// 시나리오 기록 — 그 시나리오를 완료한 회차가 최신순으로 선다. 누르면 그때 받은 피드백을 다시 본다
import { useRouter } from 'next/navigation';

import {
  HistoryListSkeleton,
  HistoryRow,
} from '@/app/(protected)/_ui/HistoryRow';
import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import { useScenarioTitle } from '@/features/scenario/model/useScenarioTitle';
import { toDayLabel } from '@/shared/lib/day-label';
import { scenarioReturnPath, scenarioSessionPath } from '@/shared/lib/routes';
import { RetryNotice } from '@/shared/ui/RetryNotice';
import { StarRating } from '@/shared/ui/StarRating';

import type { ScenarioHistorySession } from '../_api/scenario-history';
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
      <PageHeader
        title={title}
        onBack={() => router.replace(scenarioReturnPath({ date }))}
      />

      {/* 받아 둔 기록이 있으면 다시 받다 실패해도 목록을 그대로 둔다 */}
      {sessions === null && error ? (
        <RetryNotice
          screen="scenario_history"
          message={error.message || '지난 대화를 불러오지 못했어요.'}
          onRetry={retry}
        />
      ) : sessions === null ? (
        <HistoryListSkeleton rows={3} label="지난 대화를 불러오는 중" />
      ) : sessions.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm break-keep whitespace-pre-line text-muted-foreground">
          {'아직 마친 대화가 없어요.\n대화를 마치면 여기 쌓여요.'}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(var(--safe-area-inset-bottom),24px)]">
          <p className="pt-2 pb-4 text-sm text-muted-foreground">
            대화를 누르면 그때 받은 피드백을 다시 볼 수 있어요.
          </p>
          <ul className="flex flex-col gap-2">
            {sessions.map((session, index) => (
              <li key={session.sessionId}>
                <SessionRow
                  session={session}
                  // BE가 최신순으로 주니 가장 먼저 마친 회차가 1번째다
                  ordinal={sessions.length - index}
                  href={scenarioSessionPath(scenarioId, session.sessionId, {
                    date,
                  })}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
};

// 한 줄에 담기는 건 셋 — 몇 번째 대화였는지, 언제였는지, 그때 점수. 회차 화면 코드를 미리 받게 링크로 둔다
const SessionRow = ({
  session,
  ordinal,
  href,
}: {
  session: ScenarioHistorySession;
  ordinal: number;
  href: string;
}) => (
  <HistoryRow
    href={href}
    title={`${ordinal}번째 대화`}
    meta={
      <>
        {toDayLabel(session.endedAt)}
        {session.feedback &&
          ` · 원어민 이해도 ${session.feedback.nativeScore}%`}
      </>
    }
    trailing={
      session.feedback ? (
        <StarRating rating={session.feedback.starRating} size={16} />
      ) : (
        <span className="shrink-0 text-[13px] font-semibold text-muted-foreground">
          피드백 없음
        </span>
      )
    }
  />
);
