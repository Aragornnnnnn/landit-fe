'use client';

// 지난 대화 목록 — 이 시나리오로 한 대화가 최신순으로 선다(시나리오 기록과 같은 틀). 행을 누르면 그 대화의 상세 피드백으로 간다
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import {
  HistoryListSkeleton,
  HistoryRow,
} from '@/app/(protected)/_ui/HistoryRow';
import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import type { RoleplaySessionSummary } from '@/features/roleplay/api/roleplay';
import { useRoleplayScenariosQuery } from '@/features/roleplay/model/useRoleplayScenariosQuery';
import { useRoleplaySessionsQuery } from '@/features/roleplay/model/useRoleplaySessionsQuery';
import type { Locale } from '@/shared/i18n/locale';
import { toDayLabel } from '@/shared/lib/day-label';
import { getDeviceToday } from '@/shared/lib/device-today';
import {
  backOrReplace,
  ROLEPLAY_PATH,
  roleplaySessionPath,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { RetryNotice } from '@/shared/ui/RetryNotice';

const SessionRow = ({
  scenarioId,
  session,
  today,
}: {
  scenarioId: number;
  session: RoleplaySessionSummary;
  // 기기의 오늘(yyyy-MM-dd) — 행마다 시계를 읽지 않게 목록이 한 번 읽어 내려준다
  today: string;
}) => {
  const t = useTranslations('roleplay.sessions');
  const locale = useLocale() as Locale;
  // 오늘 한 대화는 하루에 여럿일 수 있어 시각까지 붙인다
  const title =
    session.talkedAt.slice(0, 10) === today
      ? t('todayLabel', {
          time: new Intl.DateTimeFormat(locale, {
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date(session.talkedAt)),
        })
      : toDayLabel(session.talkedAt, locale);

  return (
    <HistoryRow
      href={roleplaySessionPath(scenarioId, session.sessionId)}
      title={title}
      meta={
        session.correctionCount > 0
          ? t('metaCaption', {
              turns: session.turnCount,
              corrections: session.correctionCount,
            })
          : t('goodMetaCaption', {
              turns: session.turnCount,
              good: session.goodCount,
            })
      }
    />
  );
};

export const RoleplaySessions = ({ scenarioId }: { scenarioId: number }) => {
  const router = useRouter();
  const t = useTranslations('roleplay.sessions');
  const { scenarios } = useRoleplayScenariosQuery();
  const { sessions, error, retry } = useRoleplaySessionsQuery(scenarioId);
  // 서버 렌더엔 기기 시계가 없다 — 하이드레이션 뒤에 읽는다 (그 전엔 목록도 아직 없다)
  const today = useClientOnlyValue(getDeviceToday, '');
  // 제목은 탭에서 이미 받은 목록에서 꺼낸다 — 이 화면만을 위한 조회를 늘리지 않는다
  const title =
    scenarios?.find((scenario) => scenario.scenarioId === scenarioId)?.title ??
    '';

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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(var(--safe-area-inset-bottom),24px)]">
          <h2 className="pt-2 pb-3 text-lg font-bold text-foreground">
            {t('countTitle', { count: sessions.length })}
          </h2>
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <SessionRow
                  scenarioId={scenarioId}
                  session={session}
                  today={today}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
};
