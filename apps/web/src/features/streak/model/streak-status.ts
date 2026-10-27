// 스트릭이 지금 어떤 상태인지 정하는 규칙 — 열매 모양과 히어로 문구. 문구는 화면 언어로 붙인다
import type { Translator } from '@/shared/i18n/translator';

export type FruitState =
  // 오늘 열매를 채웠다
  | 'fresh'
  // 이어지는 중인데 오늘은 아직 — 오늘 안에 하면 유지된다
  | 'faded'
  // 끊겼거나 시작한 적이 없다
  | 'empty';

interface StreakState {
  currentStreakDays: number;
  activeToday: boolean;
}

export const fruitStateOf = ({
  currentStreakDays,
  activeToday,
}: StreakState) => {
  if (currentStreakDays === 0) return 'empty';
  return activeToday ? 'fresh' : 'faded';
};

export interface HeroMessage {
  title: string;
  guide: string;
}

// 고비를 넘긴 날에만 다른 말을 건넨다 — 매일 같은 문구면 며칠째든 감흥이 없다
const MILESTONE_GUIDE_KEYS: Partial<
  Record<
    number,
    | 'weekMilestoneDescription'
    | 'monthMilestoneDescription'
    | 'hundredMilestoneDescription'
  >
> = {
  7: 'weekMilestoneDescription',
  30: 'monthMilestoneDescription',
  100: 'hundredMilestoneDescription',
};

// 오늘을 이미 끝냈는지에 따라 가리키는 날이 달라진다 — 끝낸 사람에게 "오늘 끝내면"은 틀린 말이다
export const heroMessageOf = (
  {
    currentStreakDays,
    activeToday,
    totalActiveDays,
  }: StreakState & { totalActiveDays: number },
  t: Translator<'streak'>,
): HeroMessage => {
  if (totalActiveDays === 0) {
    return {
      title: t('hero.emptyTitle'),
      guide: t('hero.emptyDescription'),
    };
  }

  // 제목은 헤더와 같은 숫자를 말한다 — 0일이어도 마찬가지다.
  // 끊긴 걸 따로 알리지 않는 건 흐린 열매와 빈 달력이 이미 말하기 때문이고,
  // 오늘 하면 뭐가 되는지는 안내 줄이 맡는다
  const title = t('hero.daysTitle', { days: currentStreakDays });

  if (currentStreakDays === 0) {
    return { title, guide: t('hero.restartDescription') };
  }

  // 축하는 그 수를 채운 날에만. 어제 채운 걸 오늘 또 축하하면 김이 빠진다
  const milestone = activeToday
    ? MILESTONE_GUIDE_KEYS[currentStreakDays]
    : undefined;
  if (milestone) return { title, guide: t(`hero.${milestone}`) };

  return {
    title,
    guide: t(
      activeToday ? 'hero.tomorrowDescription' : 'hero.todayDescription',
      {
        days: currentStreakDays + 1,
      },
    ),
  };
};
