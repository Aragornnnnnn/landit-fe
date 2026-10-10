// 오늘 세 칸 — 안 한 것은 회색 동전과 더 받을 금액, 한 것은 금색 동전과 받은 금액. 환급 화면과 완료 화면이 같이 쓴다
import { formatWon } from '@/shared/lib/won';

import type { TodaySlot } from '../../model/reward-status';
import { Coin } from './Coin';

export const TodayTiles = ({ slots }: { slots: TodaySlot[] }) => (
  <ul
    className="grid w-full gap-2"
    // 표현 대상이 없는 날은 두 칸이다
    style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
  >
    {slots.map((slot) => {
      const done = slot.progress === 1;
      return (
        <li
          key={slot.type}
          className={`flex flex-col items-center rounded-2xl border px-2 py-3 ${
            done ? 'border-primary/30 bg-streak-band' : 'border-border bg-card'
          }`}
        >
          <Coin size={30} className={done ? '' : 'opacity-30 grayscale'} />
          <span className="mt-1.5 text-[13px] font-bold text-foreground">
            {slot.label}
            {slot.countLabel && !done && (
              <span className="ml-1 font-medium text-muted-foreground">
                {slot.countLabel}
              </span>
            )}
          </span>
          <span
            className={`mt-0.5 text-[13px] font-black tabular-nums ${
              done ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {done
              ? `${formatWon(slot.earnedWon)} 받음`
              : // 금액이 아직 정해지지 않았으면 비워 둔다
                slot.remainingWon !== null &&
                `+${formatWon(slot.remainingWon)}`}
          </span>
        </li>
      );
    })}
  </ul>
);
