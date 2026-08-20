// 편지함 도메인의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다 (무효화 범위 제어용)
// userId를 키에 넣어 계정이 바뀌면 다른 캐시를 보게 한다 — scenarioKeys·streakKeys와 같은 이중 방어
import type { MailboxBox } from './box';

export const mailboxKeys = {
  all: ['mailbox'] as const,
  // 편지를 읽으면 목록의 미읽음 표시와 헤더 개수만 낡는다. 그 둘만 묶어 두면
  // 방금 받아온 상세는 두고 둘만 다시 묻게 할 수 있다 (useLetterDetailQuery 참고)
  summaries: (userId: number | null) =>
    [...mailboxKeys.all, userId, 'summaries'] as const,
  letters: (userId: number | null, box: MailboxBox) =>
    [...mailboxKeys.summaries(userId), 'letters', box] as const,
  unread: (userId: number | null) =>
    [...mailboxKeys.summaries(userId), 'unread'] as const,
  // 받은 편지와 보낸 피드백은 아이디 공간이 달라 칸까지 키에 넣는다
  letter: (userId: number | null, box: MailboxBox, id: number) =>
    [...mailboxKeys.all, userId, 'letter', box, id] as const,
};
