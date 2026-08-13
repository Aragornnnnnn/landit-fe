// 편지를 펼쳤을 때의 머리말 — 종류마다 제목이 어디서 오는지가 다르다
import { describe, expect, it } from 'vitest';

import { toLetterHead } from './letter-detail-head';

describe('toLetterHead', () => {
  it('공지는 편지에 적힌 제목을 그대로 쓴다', () => {
    const head = toLetterHead({
      letterId: 1,
      kind: 'NOTICE',
      title: '우리가 앱을 만든 이유',
      sentAt: '2026-08-01T01:00:00Z',
      blocks: [],
      read: true,
    });

    expect(head).toEqual({
      title: '우리가 앱을 만든 이유',
      badge: { label: '공지', tone: 'notice' },
    });
  });

  it('답장의 제목은 내가 골랐던 피드백 유형이다', () => {
    const head = toLetterHead({
      letterId: 3,
      kind: 'REPLY',
      feedbackType: 'BUG',
      sentAt: '2026-08-09T06:47:00Z',
      replyText: '패치를 준비 중이에요.',
      quotedText: '로그인이 자꾸 풀려요.',
      read: false,
    });

    expect(head).toEqual({
      title: '문제 신고하기',
      badge: { label: '답장', tone: 'reply' },
    });
  });

  it('보낸 편지는 답장이 왔는지를 칩으로 알린다', () => {
    const pending = toLetterHead({
      letterId: 11,
      kind: 'FEEDBACK',
      feedbackType: 'FEATURE',
      status: 'PENDING',
      sentAt: '2026-08-08T09:20:00Z',
      content: '다크모드 지원해주세요.',
      reply: null,
    });

    expect(pending.badge).toEqual({ label: '처리중', tone: 'pending' });
  });

  it('답장이 도착한 보낸 편지는 목록의 처리완료 대신 도착을 말한다', () => {
    const answered = toLetterHead({
      letterId: 12,
      kind: 'FEEDBACK',
      feedbackType: 'BUG',
      status: 'ANSWERED',
      sentAt: '2026-08-03T00:14:00Z',
      content: '로그인이 자꾸 풀려요.',
      reply: { text: '패치를 준비 중이에요.', sentAt: '2026-08-09T06:47:00Z' },
    });

    expect(answered.badge).toEqual({ label: '답장 도착', tone: 'answered' });
  });
});
