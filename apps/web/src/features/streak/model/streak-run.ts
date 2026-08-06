// 이번 스트릭 줄 — 칸 일곱 개에 지금 이어지는 구간을 담는다. 달력의 한 주가 아니다
// 이레까지는 왼쪽부터 채우고, 여드레부터는 마지막 날을 다섯 번째에 고정해 굴린다.
// 숫자가 총 일수를 말하고 줄은 흐름을 말한다 — 그래서 여드레째부터 앞 칸이 잘려나가도 거짓말이 아니다
import { shiftDay, weekdayLabelOf } from '../lib/seoul-date';

const RUN_LENGTH = 7;

// 여드레 이상일 때 마지막 날이 앉는 자리 (0부터). 뒤 두 칸은 다음을 가리키는 활주로로 남는다
const ROLLING_INDEX = 4;

export interface StreakRunCell {
  date: string;
  // 요일 한 글자
  label: string;
  filled: boolean;
  // 이번 스트릭을 마지막으로 채운 날 — 도장이 찍히는 칸
  latest: boolean;
}

interface StreakRun {
  currentStreakDays: number;
  activeToday: boolean;
  // 서버가 판단에 쓴 KST 오늘
  today: string;
}

export const streakRunOf = ({
  currentStreakDays,
  activeToday,
  today,
}: StreakRun): StreakRunCell[] => {
  // 줄은 오늘이 아니라 마지막으로 채운 날에 붙는다 — 자정을 넘겨 조회가 도착해도 그림이 어긋나지 않는다
  const lastDay =
    currentStreakDays === 0 || activeToday ? today : shiftDay(today, -1);
  // 날짜를 세는 기준 칸과, 채움이 끝나는 칸은 다르다 — 0일이면 기준은 첫 칸이되 채운 칸은 없다
  const anchorIndex =
    currentStreakDays > RUN_LENGTH
      ? ROLLING_INDEX
      : Math.max(currentStreakDays - 1, 0);
  const lastFilled = currentStreakDays === 0 ? -1 : anchorIndex;

  return Array.from({ length: RUN_LENGTH }, (_, index) => {
    const date = shiftDay(lastDay, index - anchorIndex);
    return {
      date,
      label: weekdayLabelOf(date),
      // 마지막으로 채운 날까지가 채운 칸이다. 그 뒤는 아직 오지 않은 날이라 비워 둔다
      filled: index <= lastFilled,
      latest: index === lastFilled,
    };
  });
};
