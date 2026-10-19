// 결제 금액 안내의 무료 vs 프리미엄 표 — 줄마다 넉넉한 여백을 두고, 체크는 동그란 아이콘 하나로 읽히게 한다.
// 프리미엄은 주황 동그라미, 무료로도 되는 줄은 회색 동그라미, 안 되는 줄은 옅은 줄표
import { PremiumPill } from '@/features/subscription/ui/premium-brand';
import { CheckIcon } from '@/shared/ui/Icons';

const Check = ({ premium }: { premium: boolean }) => (
  <span
    className={`inline-flex size-6 items-center justify-center rounded-full ${premium ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
  >
    <CheckIcon size={14} strokeWidth={3} />
  </span>
);

const COLUMNS = 'grid grid-cols-[1fr_56px_84px] items-center';

export const CheckoutComparison = ({
  rows,
}: {
  rows: { text: string; free: boolean }[];
}) => (
  <div className="rounded-3xl border border-[#ece6de] bg-card px-5 pt-4 pb-2">
    <div className={`${COLUMNS} pb-2`}>
      <span />
      <span className="text-center text-[13px] font-bold text-muted-foreground">
        무료
      </span>
      <span className="text-center">
        <PremiumPill size="sm" />
      </span>
    </div>
    <ul>
      {rows.map(({ text, free }) => (
        <li
          key={text}
          className={`${COLUMNS} border-t border-[#f3eee8] py-3.5`}
        >
          <span className="text-[15px] font-medium text-foreground">
            {text}
          </span>
          <span className="flex justify-center">
            {free ? (
              <Check premium={false} />
            ) : (
              <span className="h-0.5 w-3 rounded-full bg-border" />
            )}
            <span className="sr-only">
              {free ? '무료 포함' : '무료 미포함'}
            </span>
          </span>
          <span className="flex justify-center">
            <Check premium />
          </span>
        </li>
      ))}
    </ul>
  </div>
);
