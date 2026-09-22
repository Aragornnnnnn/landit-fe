// 지난번과 비교 — 연회색(지난번) 위에 주황(오늘) 막대 세 줄(말한 시간·주고받은 말·가장 길게 말한 턴).
// 첫 스몰톡이면 지난번은 0으로 그려 다음부터 채워질 자리를 보여준다
import type { SmallTalkSummaryComparison } from '@/features/small-talk/api/small-talk';

import { toComparisonRows, toPeriodLabel } from '../_model/comparison-rows';

export const ComparisonCard = ({
  comparison,
}: {
  comparison: SmallTalkSummaryComparison;
}) => (
  <section className="rounded-2xl bg-card px-5 py-4 shadow-sm">
    <div className="flex items-baseline justify-between">
      <h2 className="text-[17px] font-extrabold text-foreground">
        지난번과 비교
      </h2>
      <p className="text-[12px] text-muted-foreground">
        {toPeriodLabel(comparison)}
      </p>
    </div>
    <dl className="mt-3 flex flex-col gap-4">
      {toComparisonRows(comparison).map((row) => (
        <div key={row.label}>
          <dt className="text-[12px] text-muted-foreground">{row.label}</dt>
          <dd className="mt-1.5 flex flex-col gap-1.5">
            <Bar
              ratio={row.previous.ratio}
              value={row.previous.value}
              tone="previous"
            />
            <Bar
              ratio={row.current.ratio}
              value={row.current.value}
              tone="current"
            />
          </dd>
        </div>
      ))}
    </dl>
  </section>
);

// 값이 0일 때 막대 대신 남기는 점의 길이(%) — 자리가 비어 있음을 보여준다
const EMPTY_BAR_PERCENT = 3;

// 가로 막대 하나 — 길이는 둘 중 큰 값 기준
const Bar = ({
  ratio,
  value,
  tone,
}: {
  ratio: number;
  value: string;
  tone: 'previous' | 'current';
}) => (
  <div className="flex items-center gap-2">
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full rounded-full ${tone === 'current' ? 'bg-primary' : 'bg-border'}`}
        style={{ width: `${ratio === 0 ? EMPTY_BAR_PERCENT : ratio * 100}%` }}
      />
    </div>
    <span
      className={`w-16 shrink-0 text-[13px] ${
        tone === 'current'
          ? 'font-extrabold text-primary'
          : 'font-medium text-muted-foreground'
      }`}
    >
      {value}
    </span>
  </div>
);
