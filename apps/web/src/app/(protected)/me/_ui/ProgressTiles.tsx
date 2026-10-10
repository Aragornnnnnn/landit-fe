// 내 정보 맨 위의 타일 — 환급(쌓인 금액 또는 소개)과 연속 학습 기록을 나란히 놓는다
import Link from 'next/link';

import { MAX_REFUND_WON } from '@/features/reward/model/refund-offer';
import {
  badgeAmountOf,
  type RewardBadge,
} from '@/features/reward/model/reward-status';
import { Coin } from '@/features/reward/ui/common/Coin';
import { StreakFruit } from '@/features/streak/ui/common/StreakFruit';
import { REFUND_PATH, STREAK_PATH } from '@/shared/lib/routes';
import { ChevronRightIcon } from '@/shared/ui/Icons';

// 아직 시작하지 않은 무료 유저에게 보이는 환급 타일 — 꾸미지 않고 다른 타일과 같은 모양으로 둔다
export const INVITE_BADGE: RewardBadge = {
  label: '환급 최대',
  amountWon: MAX_REFUND_WON,
  note: '매일 하면 돌려받아요',
  mood: 'kept',
};

const Tile = ({
  href,
  label,
  icon,
  value,
  note,
  warning = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  note: string;
  // 아래 한 줄을 붉게 — 오늘 안 하면 잃는 것이 있다
  warning?: boolean;
}) => (
  <Link
    href={href}
    className="flex flex-1 flex-col rounded-2xl bg-white px-4 py-3.5 transition-transform active:scale-[0.98]"
  >
    <span className="flex items-center justify-between text-[12px] font-bold text-muted-foreground">
      {label}
      <ChevronRightIcon size={14} />
    </span>
    <span className="mt-2 flex items-center gap-1.5">
      {icon}
      <span className="text-[19px] leading-none font-black text-foreground tabular-nums">
        {value}
      </span>
    </span>
    <span
      className={`mt-1.5 text-[12px] ${
        warning
          ? 'font-bold text-destructive'
          : 'font-medium text-muted-foreground'
      }`}
    >
      {note}
    </span>
  </Link>
);

export const ProgressTiles = ({
  refund,
  streakDays,
}: {
  // 환급과 상관없으면 null — 그때는 연속 학습 하나만 길게 놓인다
  refund: RewardBadge | null;
  streakDays: number;
}) => (
  <div className="flex gap-2.5">
    {refund && (
      <Tile
        href={REFUND_PATH}
        label={refund.label}
        icon={
          <Coin
            size={22}
            // 오늘 아직이면 동전도 식는다
            className={refund.mood === 'kept' ? '' : 'opacity-50 grayscale'}
          />
        }
        value={badgeAmountOf(refund)}
        note={refund.note}
        warning={refund.mood === 'atRisk'}
      />
    )}
    <Tile
      href={STREAK_PATH}
      label="연속 학습 기록"
      icon={
        <StreakFruit state={streakDays > 0 ? 'fresh' : 'empty'} size={20} />
      }
      value={`${streakDays}일`}
      note={streakDays > 0 ? '연속으로 학습 중이에요' : '오늘 대화로 시작해요'}
    />
  </div>
);
