// 대화 완료 축하 모먼트의 규칙 — 도장을 찍을지, 뭐라고 말할지
// 며칠인지는 서버가 정한다. 여기서 정하는 건 연출을 켤지 말지뿐이다. 문구는 화면 언어로 붙인다
import type { Translator } from '@/shared/i18n/translator';

// 대화에 들어갈 때 알던 스트릭. 그때 오늘이 아직이었어야 이번 완료로 열매가 새로 붙은 것이다
export interface StreakBase {
  activeToday: boolean;
}

// 그 수를 채운 날에만 다른 말을 건넨다 — 남은 날을 세는 대신 여기까지 온 걸 알아준다
const MILESTONE_REACHED_KEYS: Partial<
  Record<
    number,
    | 'weekReachedDescription'
    | 'monthReachedDescription'
    | 'hundredReachedDescription'
  >
> = {
  7: 'weekReachedDescription',
  30: 'monthReachedDescription',
  100: 'hundredReachedDescription',
};

// 최고 기록을 목표로 걸 수 있는 거리. 이보다 멀면 아득해서 목표 구실을 못 한다
const RECORD_REACH = 30;

// 제목이 이미 "N일 연속"이라 안내까지 며칟날인지 말하면 같은 말을 두 번 한다 — 여기선 다음 목표를 건다.
// 한 주 안에서는 화면에 서 있는 일곱 칸이 목표고, 그 뒤로는 자기 최고 기록이 목표다.
// 한 달·백 일은 아직 먼 사람에겐 남의 숫자로 읽힌다
const guideOf = (
  days: number,
  longestStreakDays: number | null,
  t: Translator<'streak'>,
) => {
  const reached = MILESTONE_REACHED_KEYS[days];
  if (reached) return t(`celebration.${reached}`);

  if (days < 7) return t('celebration.weekLeftDescription', { days: 7 - days });

  // 최고 기록을 모르면 목표를 지어내지 않는다
  if (longestStreakDays === null)
    return t('celebration.continuingDescription', { days });

  // 이어가는 중이면 서버가 주는 최고 기록이 오늘 것까지 반영돼 현재와 같아진다 — 그 날이 곧 갱신하는 날이다
  if (days >= longestStreakDays)
    return t('celebration.recordBreakingDescription');

  // 예전 기록이 아득히 멀면(끊기고 한참 지난 경우) 그 숫자는 목표가 아니라 벽이 된다
  const remaining = longestStreakDays - days;
  if (remaining > RECORD_REACH)
    return t('celebration.continuingDescription', { days });

  return t('celebration.recordLeftDescription', { days: remaining });
};

export interface Celebration {
  // 오늘 열매가 새로 찍히는 순간인지
  stamping: boolean;
  // 이력을 통틀어 첫 열매인지 — 계정당 한 번뿐인 순간이라 화면을 따로 준다
  first: boolean;
  title: string;
  guide: string;
}

export const celebrationOf = (
  {
    currentStreakDays,
    base,
    totalActiveDays = null,
    longestStreakDays = null,
  }: {
    currentStreakDays: number;
    base: StreakBase | null;
    // 완료한 날의 총합. 아직 모르면 null — 모를 때 첫 열매라고 단정하면 지난 기록을 없던 일로 만든다
    totalActiveDays?: number | null;
    // 지금까지의 최고 연속. 한 주를 넘긴 뒤의 목표가 된다
    longestStreakDays?: number | null;
  },
  t: Translator<'streak'>,
): Celebration => {
  // 들어갈 때 오늘이 아직이었을 때만 오늘 열매가 새로 찍힌다.
  // 같은 날 두 번째 대화면 숫자가 그대로라, 찍히는 연출이 거짓말이 된다
  const stamping = base !== null && !base.activeToday;
  // 오늘을 이미 채우고 들어온 대화인가. stamping과 달리 집어둔 값이 없는 날(오늘이 어땠는지 모르는 날)과 섞이지 않는다
  const filledEarlier = base?.activeToday === true;
  // 완료한 날이 오늘 하나뿐이어야 첫 열매다. 끊겼다 다시 붙은 1일과는 다른 날이다.
  // 같은 날 두 번째 대화에도 총합은 그대로 1이라, 여기서 걸러야 계정당 한 번이 지켜진다
  const first = totalActiveDays === 1 && !filledEarlier;

  if (currentStreakDays === 1) {
    return {
      stamping,
      first,
      // 이미 채운 날엔 방금 찍힌 것처럼 말하지 않는다 — 그 자리에 상황을 두고, 안내는 다음 목표를 그대로 건다
      title: filledEarlier
        ? t('celebration.filledEarlierTitle')
        : first
          ? t('celebration.firstTitle')
          : t('celebration.stampedTitle'),
      // "2일이 돼요"는 굳이 안 알려줘도 아는 말이다. 화면에 이미 서 있는 일곱 칸을 가리킨다
      guide: t('celebration.firstWeekDescription'),
    };
  }

  return {
    stamping,
    first: false,
    title: t('celebration.daysTitle', { days: currentStreakDays }),
    // 이미 채운 날엔 다음 목표를 걸지 않는다 — 남은 날을 세면 오늘 뭔가 는 것처럼 읽힌다
    guide: filledEarlier
      ? t('celebration.filledEarlierDescription')
      : guideOf(currentStreakDays, longestStreakDays, t),
  };
};
