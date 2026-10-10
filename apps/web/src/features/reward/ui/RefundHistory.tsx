// 환급 내역 줄들 — 통장 내역처럼 날짜·활동·금액·잔액을 한 줄씩. 실제 내역과 환급 소개의 보기 내역이 같이 쓴다
import { formatWon } from '@/shared/lib/won';

import type { HistoryRow } from '../model/reward-history';

const signedWon = (amountWon: number) =>
  amountWon < 0 ? `-${formatWon(-amountWon)}` : formatWon(amountWon);

// 줄 하나 — 따로 떼어 두면 다음 장이 붙어도, 그대로인 줄은 같은 결과를 다시 쓴다
const HistoryLine = ({ row }: { row: HistoryRow }) => (
  <li
    // 날짜가 붙는 줄(그날의 첫 줄)은 위를 조금 더 띄워 하루씩 끊어 보이게 한다
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
          {signedWon(row.amountWon)}
        </span>
      )}
      <span className="mt-0.5 block text-[13px] font-medium text-muted-foreground tabular-nums">
        {formatWon(row.balanceWon)}
      </span>
    </span>
  </li>
);

export const RefundHistory = ({ history }: { history: HistoryRow[] }) => (
  <ul className="mt-1">
    {history.map((row) => (
      <HistoryLine key={row.id} row={row} />
    ))}
  </ul>
);

// 내역을 받는 동안의 자리 — 줄마다 한 덩어리로, 실제 줄과 같은 높이를 잡는다
export const HistoryPlaceholderLines = () => (
  <div className="mt-1">
    {[0, 1, 2].map((line) => (
      <div
        key={line}
        className="animate-skeleton-flow mt-4 h-[46px] rounded-xl bg-border!"
      />
    ))}
  </div>
);
