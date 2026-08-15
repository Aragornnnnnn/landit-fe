// 피드백 등록 — 계약은 아래 그대로고, 지금은 서버 대신 임시 데이터에 쌓는다 (LAN-218)
//
//   POST /api/v1/mailbox/feedbacks
//   body { type: FeedbackType; content: string }
//   201, 응답 본문 없음 — 보낸 뒤 보낸 편지함을 다시 부르면 새 편지가 따라온다
//
// TODO(LAN-218 API 연결): 아래 한 줄로 바꾸면 끝난다. 임시 데이터 조작은 함께 지운다.
//   return api.post<void>('/api/v1/mailbox/feedbacks', body);
import type { FeedbackType } from './letter';
import {
  SENT_DETAIL_FIXTURE,
  SENT_FIXTURE,
  SENT_TITLES,
} from './letters.fixture';

export interface FeedbackSubmitRequest {
  type: FeedbackType;
  content: string;
}

// 임시 데이터가 서버 노릇을 하는 동안 새 피드백에 붙일 번호. 실제로는 백엔드가 정한다.
// 모듈 수준 가변 상태라 클라이언트에서만 안전하다 — API를 붙이며 이 파일과 함께 사라진다
let nextFeedbackId = 100;

export const submitFeedback = async ({
  type,
  content,
}: FeedbackSubmitRequest): Promise<void> => {
  const feedbackId = nextFeedbackId++;
  const createdAt = new Date().toISOString();
  const title = SENT_TITLES[type];

  SENT_FIXTURE.items.unshift({
    feedbackId,
    type,
    title,
    preview: content,
    status: 'PENDING',
    createdAt,
  });
  SENT_DETAIL_FIXTURE[feedbackId] = {
    feedbackId,
    type,
    title,
    content,
    status: 'PENDING',
    resolvedByFeedbackId: null,
    createdAt,
    updatedAt: createdAt,
    replies: [],
  };
};
