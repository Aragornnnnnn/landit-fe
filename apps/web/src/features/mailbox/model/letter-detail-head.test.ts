// 편지를 펼쳤을 때의 제목과 칩 — 받은 편지와 보낸 피드백이 제목을 다른 데서 가져온다
import { describe, expect, it } from 'vitest';

import type { ReceivedLetterDetail, SentFeedbackDetail } from '../api/mailbox';
import { toReceivedHead, toSentHead } from './letter-detail-head';

const received: ReceivedLetterDetail = {
  letterId: 1,
  letterType: 'NOTICE',
  title: '우리가 앱을 만든 이유',
  contentBlocks: [{ type: 'PARAGRAPH', text: '본문' }],
  bodyText: null,
  pinned: false,
  sentAt: '2026-08-01T10:00:00',
  readAt: null,
  feedbackType: null,
  quotedFeedbackContent: null,
};

const sent: SentFeedbackDetail = {
  feedbackId: 11,
  type: 'BUG_REPORT',
  title: '버그 제보',
  content: '로그인이 자꾸 풀려요.',
  status: 'PENDING',
  resolvedByFeedbackId: null,
  createdAt: '2026-08-08T18:20:00',
  updatedAt: '2026-08-08T18:20:00',
  replies: [],
};

describe('toReceivedHead', () => {
  it('공지·업데이트는 편지 제목을 그대로 쓴다', () => {
    expect(toReceivedHead(received).title).toBe('우리가 앱을 만든 이유');
    expect(toReceivedHead(received).badge.label).toBe('공지');
  });

  it('답장은 내가 골랐던 유형이 제목이 된다', () => {
    const reply = {
      ...received,
      letterType: 'REPLY',
      feedbackType: 'BUG_REPORT',
    } as const;

    expect(toReceivedHead(reply).title).toBe('문제 신고하기');
    expect(toReceivedHead(reply).badge.label).toBe('답장');
  });

  it('답장인데 유형이 비어 있으면 운영이 붙인 편지 제목으로 물러선다', () => {
    const reply = {
      ...received,
      letterType: 'REPLY',
      title: '보내주신 의견에 대한 답장',
    } as const;

    expect(toReceivedHead(reply).title).toBe('보내주신 의견에 대한 답장');
  });
});

describe('toSentHead', () => {
  it('제목은 내가 골랐던 유형이고, 칩은 처리 상태다', () => {
    expect(toSentHead(sent).title).toBe('문제 신고하기');
    expect(toSentHead(sent).badge.label).toBe('처리중');
  });

  it('답장이 오면 칩 문구가 바뀐다 — 목록의 "처리완료"와 달리 읽는 자리다', () => {
    expect(toSentHead({ ...sent, status: 'COMPLETED' }).badge.label).toBe(
      '답장 도착',
    );
  });
});
