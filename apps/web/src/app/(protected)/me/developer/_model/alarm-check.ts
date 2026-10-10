// 알람 점검 화면 계산 — 테스트 알람이 실제로 울릴 시각, 걸린 알람의 다음 울림을 사람 말로 옮긴다
import { formatClock } from '@/features/alarm/model/alarm-time';

const MINUTE_MS = 60_000;
// 누르고 화면을 잠글 틈 — 다음 정각 분까지 이보다 짧으면 그다음 분부터 고른다
const MIN_LEAD_MS = 20_000;
const CHOICE_MINUTES = [0, 1, 2];

/**
 * 테스트 알람 선택지 — 다음 정각 분부터 1·2·3분째 정각.
 * iOS는 분 단위로만 걸려서 "N초 뒤"를 지킬 수 없다. 처음부터 정각을 골라 두 플랫폼이 같은 시각에 울리게 한다
 */
export const testAlarmChoices = (now: Date) => {
  const first = new Date(now);
  first.setSeconds(0, 0);
  first.setTime(first.getTime() + MINUTE_MS);
  if (first.getTime() - now.getTime() < MIN_LEAD_MS) {
    first.setTime(first.getTime() + MINUTE_MS);
  }
  return CHOICE_MINUTES.map((offset) => {
    const at = new Date(first.getTime() + offset * MINUTE_MS);
    return {
      at,
      delaySeconds: Math.ceil((at.getTime() - now.getTime()) / 1000),
    };
  });
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** 걸린 알람의 다음 울림 — "오늘 오후 7:30". 이미 울린 1회 알람이면 "이미 울렸어요" */
export const describeNextRing = (nextAt: number | null, now: Date) => {
  if (nextAt === null) return '이미 울렸어요';
  const at = new Date(nextAt);
  const time = formatClock({ hour: at.getHours(), minute: at.getMinutes() });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (dayKey(at) === dayKey(now)) return `오늘 ${time}`;
  if (dayKey(at) === dayKey(tomorrow)) return `내일 ${time}`;
  return `${at.getMonth() + 1}월 ${at.getDate()}일(${DAY_NAMES[at.getDay()]}) ${time}`;
};
