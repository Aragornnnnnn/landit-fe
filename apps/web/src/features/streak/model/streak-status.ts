// 스트릭이 지금 어떤 상태인지 정하는 규칙 — 열매 모양과 히어로 문구
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

// 오늘을 이미 끝냈는지에 따라 가리키는 날이 달라진다 — 끝낸 사람에게 "오늘 끝내면"은 틀린 말이다
export const heroMessageOf = ({
  currentStreakDays,
  activeToday,
  totalActiveDays,
}: StreakState & { totalActiveDays: number }): HeroMessage => {
  if (currentStreakDays > 0) {
    return {
      title: `${currentStreakDays}일 연속 학습`,
      guide: activeToday
        ? `내일도 이어가면 ${currentStreakDays + 1}일이 돼요`
        : `오늘 대화를 끝내면 ${currentStreakDays + 1}일이 돼요`,
    };
  }

  if (totalActiveDays > 0) {
    return { title: '지금은 0일', guide: '오늘 대화 하나면 다시 1일이에요' };
  }

  return {
    title: '아직 열매가 없어요',
    guide: '오늘 첫 대화로 열매를 모아봐요',
  };
};
