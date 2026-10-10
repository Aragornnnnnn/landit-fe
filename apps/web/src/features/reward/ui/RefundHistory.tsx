// 환급 내역 — 통장 내역처럼 날짜·활동·금액·잔액을 한 줄씩. 달력은 스트릭 화면의 것이라 여기서는 쓰지 않는다
import { formatWon } from '@/shared/lib/won';

import type { HistoryRow } from '../model/reward-history';

export const RefundHistory = ({
  history,
  loadingMore = false,
}: {
  history: HistoryRow[];
  // 끝까지 내려 이전 내역을 더 받아오는 중
  loadingMore?: boolean;
}) => {
  return (
    <section className="mt-3 px-5">
      <h3 className="sr-only">환급 내역</h3>
      {history.length === 0 ? (
        <p className="mt-2 text-[13px] font-medium text-muted-foreground">
          아직 내역이 없어요
        </p>
      ) : (
        <ul className="mt-1">
          {history.map((row) => (
            <li
              key={row.id}
              className={`flex items-start gap-3 ${row.dateLabel ? 'pt-5' : 'pt-4'}`}
            >
              <span className="w-9 shrink-0 pt-0.5 text-[13px] font-medium text-muted-foreground tabular-nums">
                {row.dateLabel}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold text-foreground">
                  {row.title}
                </span>
                <span className="mt-0.5 block text-[13px] font-medium text-muted-foreground">
                  {row.note}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {row.amountWon !== null && (
                  <span
                    className={`block text-[16px] font-black tabular-nums ${
                      row.amountWon < 0 ? 'text-foreground' : 'text-primary'
                    }`}
                  >
                    {row.amountWon < 0
                      ? `-${formatWon(-row.amountWon)}`
                      : formatWon(row.amountWon)}
                  </span>
                )}
                <span className="mt-0.5 block text-[13px] font-medium text-muted-foreground tabular-nums">
                  {formatWon(row.balanceWon)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {loadingMore && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 py-6 text-[13px] font-medium text-muted-foreground"
        >
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          내역을 불러오고 있어요
        </p>
      )}
    </section>
  );
};
