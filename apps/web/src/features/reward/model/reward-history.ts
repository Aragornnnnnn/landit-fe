// 환급 내역을 통장 한 줄씩으로 바꾸는 규칙 — 무엇을 끝냈는지, 언제, 얼마가 들고 났는지
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

import type {
  RewardActivity,
  RewardHistoryItem,
  RewardHistoryPage,
} from '../api/reward';

export interface HistoryRow {
  id: string;
  // 그날의 첫 줄에만 적는다 ("10.10") — 같은 날의 줄은 이어져 보인다
  dateLabel: string | null;
  title: string;
  // 제목 아래 작은 글자 — 적립은 끝낸 시각
  note: string;
  // 받았으면 양수, 사라졌으면 음수. 들고 난 금액이 없는 줄은 null
  amountWon: number | null;
  // 이 줄까지 반영한 잔액
  balanceWon: number;
}

const EARN_TITLE: Record<RewardActivity['activityType'], string> = {
  SCENARIO: '시나리오 대화 완료',
  EXPRESSION: '표현학습 완료',
  SMALLTALK: '스몰톡 완료',
};

const dateLabelOf = (date: string) =>
  `${Number(date.slice(5, 7))}.${Number(date.slice(8))}`;

// 끝낸 시각 (HH:mm). 읽을 수 없으면 비운다 — 한 줄 때문에 내역 전체가 깨지면 안 된다
const kstClockOf = (occurredAt: string) => {
  const parts = readSeoulDateParts(occurredAt, {
    hour: '2-digit',
    minute: '2-digit',
    // h23이라야 자정이 24시로 나오지 않는다
    hourCycle: 'h23',
  });
  return parts ? `${parts.hour}:${parts.minute}` : '';
};

// 날짜를 뺀 한 줄. 모르는 종류는 null — 종류는 나중에 늘어날 수 있다(환급 입금 등)
const bodyOf = (
  item: RewardHistoryItem,
): Pick<HistoryRow, 'title' | 'note' | 'amountWon'> | null => {
  if (item.type === 'EARN')
    return {
      // 모르는 활동이어도 돈이 들어온 줄은 남긴다 — 건너뛰면 잔액이 설명 없이 뛴다
      title:
        (item.activityType && EARN_TITLE[item.activityType]) ?? '학습 완료',
      note: kstClockOf(item.occurredAt),
      amountWon: item.amountWon,
    };
  if (item.type === 'RESET')
    return {
      title: '연속 학습 끊김',
      note: '누적 환급액이 초기화됐어요',
      amountWon: item.amountWon,
    };
  if (item.type === 'CYCLE_END')
    return {
      title: '기간 종료',
      note: '환급받을 금액으로 넘어갔어요',
      amountWon: null,
    };
  return null;
};

// 서버가 준 순서(늦은 것부터)를 그대로 둔다. 이어 받는 사이 새 줄이 생기면 같은 줄이 두 번 올 수 있어 id로 거른다
export const historyRowsOf = (items: RewardHistoryItem[]): HistoryRow[] => {
  const seen = new Set<string>();
  const rows: HistoryRow[] = [];
  let lastDate: string | null = null;

  for (const item of items) {
    const body = bodyOf(item);
    if (body === null || seen.has(item.id)) continue;
    seen.add(item.id);
    rows.push({
      id: item.id,
      dateLabel: item.date === lastDate ? null : dateLabelOf(item.date),
      ...body,
      balanceWon: item.balanceWon,
    });
    lastDate = item.date;
  }
  return rows;
};

// 다음 장을 물을 커서. 더 없으면 undefined — 서버는 끝에서 null을 주지만, 빈 커서나 이미 물은 커서를 되돌려 줘도 끝으로 친다.
// 빈 커서로 부르면 첫 장을 또 받고, 물었던 커서로 부르면 받은 장을 또 받아 끝이 보이는 내내 요청이 이어진다
export const nextHistoryCursor = (
  last: RewardHistoryPage,
  asked: readonly (string | null)[],
) =>
  last.nextCursor && !asked.includes(last.nextCursor)
    ? last.nextCursor
    : undefined;
