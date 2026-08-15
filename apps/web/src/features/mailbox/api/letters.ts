// 편지함 조회 — 받은 편지와 보낸 피드백은 서버에서 다른 리소스다.
// 아직 서버를 부르지 않고 임시 데이터를 돌려준다. 모양은 계약 그대로라 실제 호출은 본문만 바꾸면 된다 (LAN-218)
//
//   GET /api/v1/mailbox/received?cursor=&size=   → MailboxPage<ReceivedLetter>
//   GET /api/v1/mailbox/received/{letterId}      → ReceivedLetterDetail  (조회하면 읽음 처리된다)
//   GET /api/v1/mailbox/sent?cursor=&size=       → MailboxPage<SentFeedback>
//   GET /api/v1/mailbox/sent/{feedbackId}        → SentFeedbackDetail
//   GET /api/v1/mailbox/unread-count             → { unreadCount }
import { ApiError } from '@/shared/api/api-error';

import type { MailboxPage, ReceivedLetter, SentFeedback } from './letter';
import type { ReceivedLetterDetail, SentFeedbackDetail } from './letter-detail';
import {
  RECEIVED_DETAIL_FIXTURE,
  RECEIVED_FIXTURE,
  SENT_DETAIL_FIXTURE,
  SENT_FIXTURE,
} from './letters.fixture';

// 없는 편지의 404는 실제 호출에서 api.get이 ApiError로 던져 준다 — 그때 이 함수는 사라진다
const notFound = (endpoint: string) =>
  new ApiError('편지를 찾을 수 없어요.', 404, endpoint);

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/received${toQuery(cursor)}`)
export const getReceivedLetters = async (): Promise<
  MailboxPage<ReceivedLetter>
> => RECEIVED_FIXTURE;

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/sent${toQuery(cursor)}`)
export const getSentFeedbacks = async (): Promise<MailboxPage<SentFeedback>> =>
  SENT_FIXTURE;

// 조회가 읽음 처리를 겸한다 — 그래서 임시 데이터도 여기서 읽음으로 바꾼다.
// 목록을 다시 불러도 읽은 상태가 남아야 미읽음 점이 정말 사라진다
// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/received/${letterId}`)
export const getReceivedLetterDetail = async (
  letterId: number,
): Promise<ReceivedLetterDetail> => {
  const letter = RECEIVED_DETAIL_FIXTURE[letterId];
  if (!letter) throw notFound(`/api/v1/mailbox/received/${letterId}`);

  const listed = RECEIVED_FIXTURE.items.find(
    (item) => item.letterId === letterId,
  );
  if (listed) listed.unread = false;

  return letter;
};

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/sent/${feedbackId}`)
export const getSentFeedbackDetail = async (
  feedbackId: number,
): Promise<SentFeedbackDetail> => {
  const feedback = SENT_DETAIL_FIXTURE[feedbackId];
  if (!feedback) throw notFound(`/api/v1/mailbox/sent/${feedbackId}`);
  return feedback;
};

// 헤더의 미읽음 점 — 목록 전체를 받아 세는 대신 개수만 묻는다
// TODO(LAN-218 API 연결): (await api.get<{ unreadCount: number }>('/api/v1/mailbox/unread-count')).unreadCount
export const getUnreadCount = async (): Promise<number> =>
  RECEIVED_FIXTURE.items.filter((letter) => letter.unread).length;
