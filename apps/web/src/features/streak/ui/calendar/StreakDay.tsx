// 달력 한 칸 — 위에 그 날의 마크(열매·빈 원), 아래에 날짜. 이어진 구간 띠는 주 행이 뒤에 깐다
import type { DayMark } from '../../model/calendar-day';
import { StreakFruit } from '../common/StreakFruit';

// 마크가 앉는 줄의 높이. 이어진 구간 띠도 같은 높이를 써야 마크가 띠 한가운데 놓인다 (StreakWeek 참고)
export const MARK_ROW_HEIGHT = 34;

// 마크와 숫자는 늘 같은 자리다 — 상태에 따라 자리가 움직이면 격자가 흔들려 읽힌다.
// 기록 밖·미래 날짜도 놓친 날과 같은 색을 쓴다. 더 옅게 하면 읽을 수 있는 대비가 안 나오고,
// 둘을 가르는 건 색이 아니라 동그라미다
const LABEL_STYLE: Record<DayMark, string> = {
  done: 'font-medium text-accent',
  today: 'font-black text-primary',
  missed: 'font-medium text-muted-foreground',
  blank: 'font-medium text-muted-foreground',
};

// 화면은 열매·테두리로 상태를 말하지만 스크린 리더에는 숫자만 읽힌다 — 상태를 말로도 준다
const MARK_LABEL: Record<DayMark, string> = {
  done: '학습 완료',
  today: '오늘, 아직 학습 전',
  missed: '학습 안 함',
  blank: '',
};

const DayMarkShape = ({ mark }: { mark: DayMark }) => {
  if (mark === 'done') return <StreakFruit state="fresh" size={14} />;
  // 오늘은 아직 못 받은 자리 — 열매가 들어올 테두리만 그려 둔다
  if (mark === 'today')
    return <span className="size-7 rounded-full border-2 border-primary" />;
  if (mark === 'missed')
    return (
      <span className="size-7 rounded-full border-[1.5px] border-border" />
    );
  // blank — 기록 밖이거나 아직 오지 않은 날. 숫자만 남긴다
  return null;
};

interface StreakDayProps {
  date: string;
  mark: DayMark;
}

export const StreakDay = ({ date, mark }: StreakDayProps) => {
  const day = Number(date.slice(8));
  const status = MARK_LABEL[mark];

  return (
    // relative를 줘야 뒤에 깔린 띠(absolute) 위로 올라온다 — 안 주면 띠가 열매를 덮는다
    <div className="relative flex flex-col items-center pb-1.5">
      {/* 눈으로는 열매·테두리가, 소리로는 이 문장이 같은 것을 말한다 */}
      <span className="sr-only">
        {Number(date.slice(5, 7))}월 {day}일{status && `, ${status}`}
      </span>

      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{ height: MARK_ROW_HEIGHT }}
      >
        <DayMarkShape mark={mark} />
      </span>

      <span
        aria-hidden
        className={`mt-1 text-[12px] leading-none ${LABEL_STYLE[mark]}`}
      >
        {day}
      </span>
    </div>
  );
};
