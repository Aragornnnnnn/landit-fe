// 편지함 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다 — scenarioKeys·streakKeys와 같은 이중 방어
import type { MailboxBox } from './box';

export const mailboxKeys = {
  all: ['mailbox'] as const,
  // 편지를 읽으면 낡는 것들을 한 묶음으로 둔다 — 상세를 다시 부르지 않고 걷어내기 위해서다
  summaries: (userId: number | null) =>
    [...mailboxKeys.all, userId, 'summaries'] as const,
  letters: (userId: number | null, box: MailboxBox) =>
    [...mailboxKeys.summaries(userId), 'letters', box] as const,
};
