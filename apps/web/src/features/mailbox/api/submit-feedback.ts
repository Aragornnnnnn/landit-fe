// 피드백 등록 — 201에 본문이 없다. 보낸 뒤 보낸 편지함을 다시 부르면 새 편지가 따라온다
import { api } from '@/shared/api/client';

import type { FeedbackType } from './letter';

export interface FeedbackSubmitRequest {
  type: FeedbackType;
  content: string;
}

export const submitFeedback = (body: FeedbackSubmitRequest) =>
  api.post<void>('/api/v1/mailbox/feedbacks', body);
