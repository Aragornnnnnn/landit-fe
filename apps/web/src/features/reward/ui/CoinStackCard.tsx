// 환급이 쌓이는 모습 — 날마다 동전 기둥이 한 개씩 높아지고, 마지막 날엔 결제한 만큼이 쌓인다. 동전은 앱의 실제 환급 동전이다
import { formatWon } from '@/shared/lib/won';
import { Emoji } from '@/shared/ui/emoji';

import type { RewardOffer } from '../model/refund-offer';
import { Coin } from './common/Coin';

/** 앞의 사흘만 보여 주고 「···」로 건너뛴다 */
const EARLY_DAYS = [1, 2, 3];

/** 동전을 위로 겹쳐 쌓는다 — 위 동전이 앞에 오도록 아래부터 그린다 */
const CoinPile = ({ count, size }: { count: number; size: number }) => (
  <div className="flex flex-col-reverse items-center">
    {Array.from({ length: count }, (_, index) => (
      <Coin
        key={index}
        size={size}
        className={index === 0 ? '' : '-mb-[70%]'}
      />
    ))}
  </div>
);

export const CoinStackCard = ({ offer }: { offer: RewardOffer }) => (
  <div className="rounded-3xl bg-[linear-gradient(180deg,#fff1db,#fffaf3)] px-5 pt-6 pb-5">
    <div className="flex items-end justify-between">
      {EARLY_DAYS.map((day) => (
        <div key={day} className="flex flex-col items-center gap-2">
          <CoinPile count={day} size={34} />
          <p className="text-[13px] font-bold text-foreground tabular-nums">
            {formatWon(offer.dailyWon * day)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{day}일</p>
        </div>
      ))}
      <p
        aria-hidden="true"
        className="mb-12 text-lg font-black tracking-widest text-[#d6c7b4]"
      >
        ···
      </p>
      <div className="flex flex-col items-center gap-2">
        <CoinPile count={6} size={56} />
        <p className="text-[17px] font-black text-primary tabular-nums">
          {formatWon(offer.maximumWon)}
        </p>
        <p className="text-xs font-medium text-primary">{offer.days}일</p>
      </div>
    </div>
    <ul className="mt-5 flex flex-col gap-2.5 border-t border-[#efdfc8] pt-4 text-sm font-bold text-foreground">
      <li className="flex items-center gap-2">
        <Emoji className="text-lg">🏦</Emoji>
        {offer.days}일 뒤에 모은 돈을 출금할 수 있어요
      </li>
      <li className="flex items-center gap-2">
        <Emoji className="text-lg">🙆</Emoji>
        얼마를 쌓든 다 돌려받아요
      </li>
    </ul>
  </div>
);
