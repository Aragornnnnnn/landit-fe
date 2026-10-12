'use client';

// 오늘 몫을 놓치기까지(한국 시각 자정) 줄어드는 시계 — 오늘 받을 금액이 남았고 여섯 시간이 안 남았을 때 화면 맨 위에 뜬다. 모은 금액은 그대로고 오늘 몫만 걸려 있다
import { clockLabel } from '@/features/reward/model/time-left';
import { useMidnightLeft } from '@/features/reward/model/useMidnightLeft';
import { formatWon } from '@/shared/lib/won';

// 초마다 다시 그리는 범위를 이 한 줄로 가둔다
export const MidnightCountdown = ({ amountWon }: { amountWon: number }) => {
  const left = useMidnightLeft();

  return (
    <p
      // 초마다 읽어 주면 시끄럽다 — 같은 내용은 아래 안내 문구가 말한다
      aria-hidden
      className="flex h-9 items-center gap-2 rounded-full bg-destructive px-4 text-[13px] font-bold text-destructive-foreground"
    >
      오늘 {formatWon(amountWon)} 놓치기까지
      <span className="text-[16px] font-black tabular-nums">
        {clockLabel(left)}
      </span>
    </p>
  );
};
