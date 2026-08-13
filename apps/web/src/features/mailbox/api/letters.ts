// 편지함 조회 — 받은 편지와 보낸 피드백은 서버에서 다른 리소스다.
// 아직 서버를 부르지 않고 픽스처를 돌려준다. 모양은 계약 그대로라, 실제 호출은 본문만 바꾸면 된다 (LAN-218)
//
//   GET /api/v1/mailbox/received?cursor=&size=  → MailboxPage<ReceivedLetter>
//   GET /api/v1/mailbox/sent?cursor=&size=      → MailboxPage<SentFeedback>
//   GET /api/v1/mailbox/received/{letterId}     → LetterDetail
import { ApiError } from '@/shared/api/api-error';

import type { MailboxPage, ReceivedLetter, SentFeedback } from './letter';
import type { LetterDetail } from './letter-detail';
import {
  DETAIL_FIXTURE,
  RECEIVED_FIXTURE,
  SENT_FIXTURE,
} from './letters.fixture';

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/received${toQuery(cursor)}`)
export const getReceivedLetters = async (): Promise<
  MailboxPage<ReceivedLetter>
> => RECEIVED_FIXTURE;

// TODO(LAN-218 API 연결): api.get(`/api/v1/mailbox/sent${toQuery(cursor)}`)
export const getSentFeedbacks = async (): Promise<MailboxPage<SentFeedback>> =>
  SENT_FIXTURE;

// TODO(LAN-218 API 연결): api.get<LetterDetail>(`/api/v1/mailbox/received/${letterId}`)
// 없는 편지의 404는 api.get이 ApiError로 던져 주므로 아래 수동 throw는 함께 지운다.
// 화면은 error.message를 그대로 쓰므로 그때부터 문구가 백엔드 것으로 바뀐다
export const getLetterDetail = async (
  letterId: number,
): Promise<LetterDetail> => {
  const letter = DETAIL_FIXTURE[letterId];
  if (!letter) {
    throw new ApiError(
      '편지를 찾을 수 없어요.',
      404,
      `/api/v1/mailbox/received/${letterId}`,
    );
  }
  return letter;
};

// 읽음 처리. 픽스처를 직접 고치는 건 지금 픽스처가 서버 노릇을 하고 있어서다 —
// 목록을 다시 불러도 읽은 상태가 남아야 미읽음 점이 정말 사라진다
export const markLetterRead = async (letterId: number): Promise<void> => {
  const letter = RECEIVED_FIXTURE.items.find(
    (item) => item.letterId === letterId,
  );
  if (letter) letter.unread = false;
};

// 헤더의 미읽음 점 — 목록 전체를 받아 세는 대신 존재 여부만 묻는다.
// TODO(LAN-218 API 연결): (await api.get<{ unreadCount: number }>('/api/v1/mailbox/unread-count')).unreadCount > 0
export const getHasUnreadLetters = async (): Promise<boolean> =>
  RECEIVED_FIXTURE.items.some((letter) => letter.unread);
