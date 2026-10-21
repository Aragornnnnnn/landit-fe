// 환급이 쌓이는 모습 — 날마다 동전 기둥이 한 개씩 높아지고, 마지막 날엔 결제한 만큼이 쌓인다. 동전은 앱의 실제 환급 동전이다.
// 페이월 혜택 01, 환급 소개, 환급 안내 시트가 같은 그림을 쓴다
import type { CSSProperties } from 'react';

import { formatWon } from '@/shared/lib/won';
import { Emoji } from '@/shared/ui/emoji';

import type { RewardOffer } from '../model/refund-offer';
import { Coin } from './common/Coin';

/** 앞의 사흘만 보여 주고 「···」로 건너뛴다 */
const EARLY_DAYS = [1, 2, 3];
/** 마지막 날 기둥이 서는 장면 — 앞의 사흘이 1·2·3 장면에 하나씩 선다 */
export const COIN_TOWER_STEP = EARLY_DAYS.length + 1;

/** 동전을 위로 겹쳐 쌓는다 — 위 동전이 앞에 오도록 아래부터 그리고, 하나씩 위에서 떨어지듯 차례로 내려앉는다.
 * heavy면 높은 데서 한꺼번에 무겁게 떨어진다 — 마지막 날 기둥이 「쾅」 하고 서는 자리 */
const CoinPile = ({
  count,
  size,
  shown,
  heavy = false,
}: {
  count: number;
  size: number;
  shown: boolean;
  heavy?: boolean;
}) => (
  <div className="flex flex-col-reverse items-center">
    {Array.from({ length: count }, (_, index) => (
      <span
        key={index}
        className={`transition-[translate,opacity] ${heavy ? 'duration-[320ms] ease-[cubic-bezier(0.55,0,0.9,0.4)]' : 'duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'} ${index === 0 ? '' : '-mb-[70%]'} ${shown ? 'translate-y-0 opacity-100' : heavy ? '-translate-y-24 opacity-0' : '-translate-y-4 opacity-0'}`}
        style={
          {
            transitionDelay: shown ? `${index * (heavy ? 25 : 70)}ms` : '0ms',
          } as CSSProperties
        }
      >
        <Coin size={size} />
      </span>
    ))}
  </div>
);

/**
 * @param step 몇 번째 장면까지 보였는가 — 1·2·3이면 그날 기둥까지, {@link COIN_TOWER_STEP} 이상이면 마지막 날 기둥까지 선다. 없으면 다 보인다
 * @param animated 연출 중인가 — 그러면 마지막 날 기둥이 설 때 카드가 「쾅」 눌렸다 튀어 오른다. 처음부터 다 보이는 그림에선 흔들지 않는다
 */
export const CoinStackCard = ({
  offer,
  step = COIN_TOWER_STEP,
  animated = false,
}: {
  offer: RewardOffer;
  step?: number;
  animated?: boolean;
}) => {
  const tower = step >= COIN_TOWER_STEP;

  return (
    <div
      className={`rounded-3xl bg-[linear-gradient(180deg,#fff1db,#fffaf3)] px-5 pt-6 pb-5 ${animated && tower ? 'animate-coin-thud' : ''}`}
    >
      <div className="flex items-end justify-between">
        {EARLY_DAYS.map((day) => (
          <div key={day} className="flex flex-col items-center gap-2">
            <CoinPile count={day} size={34} shown={step >= day} />
            <p className="text-13 font-bold text-foreground tabular-nums">
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
          <CoinPile count={6} size={56} shown={tower} heavy={animated} />
          {/* 다 모은 금액은 기둥이 설 때 커지며 주황으로 켜진다 — 그 전엔 흐린 자리만 지킨다 */}
          <p
            className={`text-17 font-black tabular-nums transition-[scale,color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${tower ? 'scale-100 text-primary delay-300' : 'scale-75 text-[#d6c7b4]'}`}
          >
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
};
