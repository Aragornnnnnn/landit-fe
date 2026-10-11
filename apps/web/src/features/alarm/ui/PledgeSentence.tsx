// 다짐 문장 — "저는 매일 [시각]에 / 영어 공부를 하겠습니다!". 다짐 화면·완료 화면이 같은 칩과 문장을 쓴다
import type { AlarmTime } from '@landit/bridge';

import { useAlarmCopy } from '../model/alarm-copy';
import { formatClock } from '../model/alarm-time';

// 문장 속 시각 칩 — 숫자 폭을 고정해 시각이 바뀌어도 문장이 들썩이지 않게 한다
export const TimeChip = ({
  time,
  ref,
}: {
  time: AlarmTime;
  ref?: React.Ref<HTMLSpanElement>;
}) => (
  <span
    ref={ref}
    className="rounded-lg bg-primary/12 px-1.5 text-primary tabular-nums"
  >
    {formatClock(time)}
  </span>
);

// 문장 내용만 그린다 — 감싸는 요소(제목·문단)와 글자 크기는 쓰는 쪽이 정한다
export const PledgeSentence = ({
  time,
  chipRef,
}: {
  time: AlarmTime;
  chipRef?: React.Ref<HTMLSpanElement>;
}) => {
  const copy = useAlarmCopy();
  return (
    <>
      저는 매일 <TimeChip time={time} ref={chipRef} />에
      <br />
      <span className="whitespace-pre-line">{copy.pledgeClosing}</span>
    </>
  );
};
