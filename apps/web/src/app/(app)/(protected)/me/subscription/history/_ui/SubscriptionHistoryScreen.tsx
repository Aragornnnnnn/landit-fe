'use client';

// 결제 내역 화면 — 한 줄에 무슨 일·플랜·날짜, 오른쪽에 금액. 최근 50건이라 페이지가 없다
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import { summarizeSubscriptionEvent } from '@/features/subscription/model/my-subscription/subscription-events';
import { useSubscriptionEventsQuery } from '@/features/subscription/model/my-subscription/useSubscriptionEventsQuery';
import { backOrReplace, SUBSCRIPTION_MANAGE_PATH } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';

import { MenuGroup, ROW_CLASS, ROW_STYLE } from '../../../_ui/Menu';

const Notice = ({ children }: { children: React.ReactNode }) => (
  <p className="pt-16 text-center text-14" style={{ color: '#6b7280' }}>
    {children}
  </p>
);

export const SubscriptionHistoryScreen = () => {
  const router = useRouter();
  const t = useTranslations('subscription');
  const locale = useLocale();
  const { events, isPending, isError } = useSubscriptionEventsQuery();

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader
        title={t('subscriptionHistory.title')}
        onBack={() => backOrReplace(router, SUBSCRIPTION_MANAGE_PATH)}
      />

      <div className="flex-1 overflow-y-auto bg-muted px-4 pt-4 pb-[max(var(--safe-area-inset-bottom),32px)]">
        {isPending ? null : isError ? (
          <Notice>{t('subscriptionHistory.loadError')}</Notice>
        ) : events.length === 0 ? (
          <Notice>{t('subscriptionHistory.emptyBody')}</Notice>
        ) : (
          <MenuGroup>
            {events.map((event) => {
              const line = summarizeSubscriptionEvent(event, t);
              const date = formatSubscriptionDate(event.occurredAt, locale);
              return (
                <div
                  key={event.eventId}
                  className={`${ROW_CLASS} py-3`}
                  style={ROW_STYLE}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="text-15" style={{ color: '#111' }}>
                      {line.title}
                      {line.plan && ` · ${line.plan}`}
                      {line.sandbox && (
                        <span
                          className="ml-1.5 rounded px-1 align-middle text-10"
                          style={{ background: '#F2F2F7', color: '#6b7280' }}
                        >
                          {t('subscriptionHistory.sandboxBadge')}
                        </span>
                      )}
                    </span>
                    {date && (
                      <span className="text-12" style={{ color: '#6b7280' }}>
                        {date}
                      </span>
                    )}
                  </div>
                  {line.amount && (
                    <span
                      className="text-15 font-semibold"
                      style={{ color: '#111' }}
                    >
                      {line.amount}
                    </span>
                  )}
                </div>
              );
            })}
          </MenuGroup>
        )}
      </div>
    </main>
  );
};
