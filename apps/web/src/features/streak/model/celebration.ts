// 대화 완료 축하 모먼트의 규칙 — 도장을 찍을지, 뭐라고 말할지
// 며칠인지는 서버가 정한다. 여기서 정하는 건 연출을 켤지 말지뿐이다

// 대화에 들어갈 때 알던 스트릭. 그때 오늘이 아직이었어야 이번 완료로 열매가 새로 붙은 것이다
export interface StreakBase {
  activeToday: boolean;
}

// 그 수를 채운 날에만 다른 말을 건넨다 — 남은 날을 세는 대신 여기까지 온 걸 알아준다
const MILESTONE_REACHED: Record<number, string> = {
  7: '일주일 연속! 이 기세면 원어민 실력도 시간 문제예요',
  30: '한 달을 채웠어요! 꾸준히 하는 모습이 멋져요',
  100: '백 일 동안 하루도 안 빠졌어요! 정말 멋져요',
};

// 최고 기록을 목표로 걸 수 있는 거리. 이보다 멀면 아득해서 목표 구실을 못 한다
const RECORD_REACH = 30;

// 제목이 이미 "N일 연속"이라 안내까지 며칟날인지 말하면 같은 말을 두 번 한다 — 여기선 다음 목표를 건다.
// 한 주 안에서는 화면에 서 있는 일곱 칸이 목표고, 그 뒤로는 자기 최고 기록이 목표다.
// 한 달·백 일은 아직 먼 사람에겐 남의 숫자로 읽힌다
const guideOf = (days: number, longestStreakDays: number | null) => {
  const reached = MILESTONE_REACHED[days];
  if (reached) return reached;

  if (days < 7) return `한 주 연속까지 ${7 - days}일 남았어요`;

  // 최고 기록을 모르면 목표를 지어내지 않는다
  if (longestStreakDays === null) return `${days}일째 이어가고 있어요`;

  // 이어가는 중이면 서버가 주는 최고 기록이 오늘 것까지 반영돼 현재와 같아진다 — 그 날이 곧 갱신하는 날이다
  if (days >= longestStreakDays) return '최고 기록을 새로 쓰는 중이에요';

  // 예전 기록이 아득히 멀면(끊기고 한참 지난 경우) 그 숫자는 목표가 아니라 벽이 된다
  const remaining = longestStreakDays - days;
  if (remaining > RECORD_REACH) return `${days}일째 이어가고 있어요`;

  return `최고 기록까지 ${remaining}일 남았어요`;
};

export interface Celebration {
  // 오늘 열매가 새로 찍히는 순간인지
  stamping: boolean;
  // 이력을 통틀어 첫 열매인지 — 계정당 한 번뿐인 순간이라 화면을 따로 준다
  first: boolean;
  title: string;
  guide: string;
}

export const celebrationOf = ({
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
}): Celebration => {
  // 들어갈 때 오늘이 아직이었을 때만 오늘 열매가 새로 찍힌다.
  // 같은 날 두 번째 대화면 숫자가 그대로라, 찍히는 연출이 거짓말이 된다
  const stamping = base !== null && !base.activeToday;
  // 완료한 날이 오늘 하나뿐이어야 첫 열매다. 끊겼다 다시 붙은 1일과는 다른 날이다
  const first = totalActiveDays === 1;

  if (currentStreakDays === 1) {
    return {
      stamping,
      first,
      title: first ? '첫 열매예요!' : '오늘 열매를 채웠어요',
      // "2일이 돼요"는 굳이 안 알려줘도 아는 말이다. 화면에 이미 서 있는 일곱 칸을 가리킨다
      guide: '내일도 이어가서 한 주를 채워봐요',
    };
  }

  return {
    stamping,
    first: false,
    title: `${currentStreakDays}일 연속`,
    guide: guideOf(currentStreakDays, longestStreakDays),
  };
};
