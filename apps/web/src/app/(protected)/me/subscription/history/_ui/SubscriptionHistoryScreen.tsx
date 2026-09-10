'use client';

// 결제 내역 화면 — 한 줄에 무슨 일·플랜·날짜, 오른쪽에 금액. 최근 50건이라 페이지가 없다
import { useRouter } from 'next/navigation';

import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import { summarizeSubscriptionEvent } from '@/features/subscription/model/subscription-events';
import { useSubscriptionEventsQuery } from '@/features/subscription/model/useSubscriptionEventsQuery';
import { backOrReplace, SUBSCRIPTION_MANAGE_PATH } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';

import { MenuGroup, ROW_CLASS, ROW_STYLE } from '../../../_ui/Menu';

const Notice = ({ children }: { children: React.ReactNode }) => (
  <p className="pt-16 text-center text-[14px]" style={{ color: '#6b7280' }}>
    {children}
  </p>
);

export const SubscriptionHistoryScreen = () => {
  const router = useRouter();
  const { events, isPending, isError } = useSubscriptionEventsQuery();

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader
        title="결제 내역"
        onBack={() => backOrReplace(router, SUBSCRIPTION_MANAGE_PATH)}
      />

      <div className="flex-1 overflow-y-auto bg-muted px-4 pt-4 pb-8">
        {isPending ? null : isError ? (
          <Notice>결제 내역을 불러오지 못했어요</Notice>
        ) : events.length === 0 ? (
          <Notice>아직 결제 내역이 없어요</Notice>
        ) : (
          <MenuGroup>
            {events.map((event) => {
              const line = summarizeSubscriptionEvent(event);
              const date = formatSubscriptionDate(event.occurredAt);
              return (
                <div
                  key={event.eventId}
                  className={`${ROW_CLASS} py-3`}
                  style={ROW_STYLE}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="text-[14.5px]" style={{ color: '#111' }}>
                      {line.title}
                      {line.plan && ` · ${line.plan}`}
                      {line.sandbox && (
                        <span
                          className="ml-1.5 rounded px-1 align-middle text-[10px]"
                          style={{ background: '#F2F2F7', color: '#6b7280' }}
                        >
                          테스트
                        </span>
                      )}
                    </span>
                    {date && (
                      <span
                        className="text-[12px]"
                        style={{ color: '#6b7280' }}
                      >
                        {date}
                      </span>
                    )}
                  </div>
                  {line.amount && (
                    <span
                      className="text-[14.5px] font-semibold"
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
