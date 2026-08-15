// 편지함 조회 — 받은 편지와 보낸 피드백은 서버에서 다른 리소스다.
// 아직 서버를 부르지 않고 픽스처를 돌려준다. 모양은 계약 그대로라, 실제 호출은 본문만 바꾸면 된다 (LAN-218)
//
//   GET /api/v1/mailbox/received?cursor=&size=  → MailboxPage<ReceivedLetter>
//   GET /api/v1/mailbox/sent?cursor=&size=      → MailboxPage<SentFeedback>
import type { MailboxPage, ReceivedLetter, SentFeedback } from './letter';
import { RECEIVED_FIXTURE, SENT_FIXTURE } from './letters.fixture';

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/received${toQuery(cursor)}`)
export const getReceivedLetters = async (): Promise<
  MailboxPage<ReceivedLetter>
> => RECEIVED_FIXTURE;

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/sent${toQuery(cursor)}`)
export const getSentFeedbacks = async (): Promise<MailboxPage<SentFeedback>> =>
  SENT_FIXTURE;
