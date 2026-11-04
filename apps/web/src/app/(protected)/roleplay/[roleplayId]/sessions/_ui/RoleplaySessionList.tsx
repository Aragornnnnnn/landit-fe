'use client';

// 지난 대화 목록 — 이 시나리오로 한 대화가 최신순으로 선다(시나리오 기록과 같은 틀). 행을 누르면 그 대화의 상세 피드백으로 간다
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import {
  HistoryListSkeleton,
  HistoryRow,
} from '@/app/(protected)/_ui/HistoryRow';
import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import type { RoleplayHistorySummary } from '@/features/roleplay/api/roleplay';
import { useRoleplayHistoryQuery } from '@/features/roleplay/model/useRoleplayHistoryQuery';
import { useRoleplayScenariosQuery } from '@/features/roleplay/model/useRoleplayScenariosQuery';
import type { Locale } from '@/shared/i18n/locale';
import { toDayLabel } from '@/shared/lib/day-label';
import {
  backOrReplace,
  ROLEPLAY_PATH,
  roleplayTranscriptPath,
} from '@/shared/lib/routes';
import { RetryNotice } from '@/shared/ui/RetryNotice';

// 한 줄에 담기는 건 둘 — 몇 번째 대화였는지, 언제였는지
const SessionRow = ({
  roleplayId,
  session,
  ordinal,
}: {
  roleplayId: number;
  session: RoleplayHistorySummary;
  ordinal: number;
}) => {
  const t = useTranslations('roleplay.sessions');
  const locale = useLocale() as Locale;

  return (
    <HistoryRow
      href={roleplayTranscriptPath(session.sessionId, roleplayId)}
      title={t('sessionTitle', { ordinal })}
      meta={toDayLabel(session.completedAt, locale)}
    />
  );
};

export const RoleplaySessionList = ({ roleplayId }: { roleplayId: number }) => {
  const router = useRouter();
  const t = useTranslations('roleplay.sessions');
  const { scenarios } = useRoleplayScenariosQuery();
  const { sessions, error, retry } = useRoleplayHistoryQuery(roleplayId);
  // 제목은 탭에서 이미 받은 목록에서 꺼낸다 — 이 화면만을 위한 조회를 늘리지 않는다
  const title =
    scenarios?.find((scenario) => scenario.id === roleplayId)?.title ?? '';

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <PageHeader
        title={title}
        onBack={() => backOrReplace(router, ROLEPLAY_PATH)}
      />

      {error ? (
        <RetryNotice
          fill
          screen="roleplay_history"
          message={t('loadError')}
          onRetry={retry}
        />
      ) : sessions === null ? (
        <HistoryListSkeleton rows={3} label={t('loadingLabel')} />
      ) : sessions.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm break-keep text-muted-foreground">
          {t('emptyDescription')}
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-[max(var(--safe-area-inset-bottom),24px)]">
          <ul className="flex flex-col gap-2">
            {sessions.map((session, index) => (
              <li key={session.sessionId}>
                <SessionRow
                  roleplayId={roleplayId}
                  session={session}
                  // 서버가 최신순으로 주니 가장 먼저 마친 대화가 1번째다
                  ordinal={sessions.length - index}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
};
