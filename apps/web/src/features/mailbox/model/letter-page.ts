// 목록의 다음 장을 이어 받는 규칙 — 서버가 다음이 있다고 할 때만, 그 커서로 묻는다
import type { MailboxPage } from '../api/letter';

// 다음이 있다는데 커서가 없으면 없는 것으로 친다. 빈 커서로 부르면 첫 장을 또 받아 같은 줄이 두 번 붙는다
export const nextLetterCursor = (last: MailboxPage<unknown>) =>
  last.hasNext && last.nextCursor ? last.nextCursor : undefined;
