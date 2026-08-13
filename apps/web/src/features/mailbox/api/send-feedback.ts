// 피드백 보내기 — 백엔드 엔드포인트가 아직 없어 픽스처에 쌓는다 (LAN-218)
//
// TODO(LAN-218 API 연결): 아래 한 줄로 바꾸면 끝난다. 픽스처 조작은 함께 지운다.
//   return api.post<void>('/api/v1/mailbox/feedbacks', { feedbackType, content });
//
// 제안한 계약.
//   POST /api/v1/mailbox/feedbacks
//   body { feedbackType: FeedbackType; content: string }
//   201 응답 본문은 필요 없다 — 보낸 뒤 보낸 편지함을 다시 부르면 새 편지가 따라온다
import type { FeedbackType } from './letter';
import { DETAIL_FIXTURE, SENT_FIXTURE } from './letters.fixture';

// 픽스처가 서버 노릇을 하는 동안 새 편지에 붙일 번호. 실제로는 백엔드가 정한다.
// 모듈 수준 가변 상태라 클라이언트에서만 안전하다 — API를 붙이며 이 파일과 함께 사라진다
let nextLetterId = 100;

export const sendFeedback = async (
  feedbackType: FeedbackType,
  content: string,
): Promise<void> => {
  const letterId = nextLetterId++;
  const sentAt = new Date().toISOString();

  SENT_FIXTURE.unshift({
    letterId,
    feedbackType,
    status: 'PENDING',
    preview: content,
    sentAt,
  });
  DETAIL_FIXTURE[letterId] = {
    letterId,
    kind: 'FEEDBACK',
    feedbackType,
    status: 'PENDING',
    sentAt,
    content,
    reply: null,
  };
};
