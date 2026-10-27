// 연속 기록 히어로 — 큰 열매와 현재 상태 한 줄, 그 아래 다음 행동을 가리키는 안내
import { useTranslations } from 'next-intl';

import { fruitStateOf, heroMessageOf } from '../../model/streak-status';
import { StreakFruit } from '../common/StreakFruit';

interface StreakHeroProps {
  currentStreakDays: number;
  activeToday: boolean;
  totalActiveDays: number;
}

export const StreakHero = ({
  currentStreakDays,
  activeToday,
  totalActiveDays,
}: StreakHeroProps) => {
  const t = useTranslations('streak');
  const state = fruitStateOf({ currentStreakDays, activeToday });
  const { title, guide } = heroMessageOf(
    { currentStreakDays, activeToday, totalActiveDays },
    t,
  );

  return (
    <section className="flex flex-col items-center px-5 pt-4">
      <StreakFruit state={state} size={54} animated priority />
      <h2 className="mt-2 text-[32px] leading-tight font-black text-foreground">
        {title}
      </h2>
      <p className="mt-1.5 text-14 font-medium text-muted-foreground">
        {guide}
      </p>
    </section>
  );
};
