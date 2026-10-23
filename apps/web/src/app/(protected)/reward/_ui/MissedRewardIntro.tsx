'use client';

// 무료로 대화한 날이 쌓인 사람(대화 3일째부터)이 보는 환급 화면 — 프리미엄이었다면 받았을 금액을 흐리게 보여 주고, 오늘 몫은 아직 받을 수 있다고 권한다
import type {
  MissedReward,
  MissedRow,
} from '@/features/reward/model/missed-reward';
import { useMidnightUrgent } from '@/features/reward/model/useMidnightUrgent';
import {
  useRewardPreviewHistoryQuery,
  type RewardHistoryState,
} from '@/features/reward/model/useRewardHistoryQuery';
import { formatWon } from '@/shared/lib/won';

import { missedCopyOf } from '../_model/reward-intro-copy';
import { EmphasizedText } from './EmphasizedText';
import { MidnightCountdown } from './MidnightCountdown';
import { HistoryFeedList } from './RewardHistoryFeed';
import { RewardPot } from './RewardPot';

// 실제 화면 — 지난 기록을 서버에서 받아 그린다
export const MissedRewardIntro = ({ missed }: { missed: MissedReward }) => (
  <MissedRewardView
    missed={missed}
    history={useRewardPreviewHistoryQuery(missed.today)}
  />
);

// 그리기만 하는 몸통 — 개발자 환급 점검이 가짜 기록을 넣어 같은 화면을 연다
export const MissedRewardView = ({
  missed,
  history,
}: {
  missed: MissedReward;
  history: RewardHistoryState<MissedRow>;
}) => {
  const copy = missedCopyOf(missed);
  // 오늘 끝낸 대화는 오늘 시작해야 인정된다 — 자정이 가까우면 시계로 알린다
  const urgent = useMidnightUrgent(missed.talkedToday);

  return (
    <div className="pb-8">
      <section className="flex flex-col items-center px-5 pt-4">
        {urgent && <MidnightCountdown amountWon={missed.dailyWon} />}
        {/* 손을 흔들며 재촉하는 래디 — 아직 늦지 않았다는 말과 맞춘다 */}
        <RewardPot stage="urgent" dropsCoin={false} />
        <p className="mt-2 text-13 font-bold text-muted-foreground">
          {copy.eyebrow}
        </p>
        {/* 받지 못한 돈이라 흐리게 — 주황은 지금 받을 수 있는 돈에만 쓴다 */}
        <h2 className="mt-0.5 text-[36px] leading-tight font-black text-muted-foreground/50">
          {copy.amount}
        </h2>
      </section>

      <div className="mx-5 mt-4 rounded-2xl bg-primary/10 px-4 py-3.5 text-center">
        <p className="text-15 font-medium whitespace-pre-line text-foreground">
          <EmphasizedText line={copy.box} />
        </p>
        <p className="mt-1 text-13 font-medium text-muted-foreground">
          {copy.note}
        </p>
      </div>

      <p className="mt-6 px-5 text-13 font-bold text-muted-foreground">기록</p>
      <HistoryFeedList
        {...history}
        renderRows={(rows) => (
          <ul className="mt-1">
            {rows.map((row) => (
              <MissedLine key={row.id} row={row} />
            ))}
          </ul>
        )}
      />
    </div>
  );
};

// 실제 환급 내역과 같은 자리에 날짜·제목·금액을 두되, 받지 못한 날은 흐리게 적는다
const MissedLine = ({ row }: { row: MissedRow }) => (
  <li className="flex items-center gap-3 pt-4">
    <span
      className={`w-9 shrink-0 text-13 font-medium tabular-nums ${row.isToday ? 'text-primary' : 'text-muted-foreground'}`}
    >
      {row.dateLabel}
    </span>
    <span
      className={`min-w-0 flex-1 text-16 font-bold ${row.isToday ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      시나리오 대화 완료
    </span>
    <span
      className={`shrink-0 text-right ${row.isToday ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <span className="block text-16 font-black tabular-nums">
        {row.isToday ? '+' : ''}
        {formatWon(row.amountWon)}
      </span>
      <span className="mt-0.5 block text-13 font-medium">
        {row.isToday ? '받을 수 있어요' : '못 받았어요'}
      </span>
    </span>
  </li>
);
