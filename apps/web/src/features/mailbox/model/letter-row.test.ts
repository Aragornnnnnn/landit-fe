// 받은 편지와 보낸 피드백을 같은 줄 모양으로 맞추는 변환 — 두 갈래가 제목과 미읽음을 다르게 정한다
import { describe, expect, it } from 'vitest';

import type { ReceivedLetter, SentFeedback } from '../api/mailbox';
import { toReceivedRow, toSentRow } from './letter-row';

const received: ReceivedLetter = {
  letterId: 1,
  letterType: 'REPLY',
  title: '보내주신 의견에 대한 답장',
  preview: '불편을 드려 죄송해요!',
  pinned: false,
  sentAt: '2026-08-09T11:30:00',
  unread: true,
};

const sent: SentFeedback = {
  feedbackId: 7,
  type: 'BUG_REPORT',
  title: '버그 제보',
  preview: '로그인이 자꾸 풀려요.',
  status: 'PENDING',
  createdAt: '2026-08-08T18:20:00',
};

describe('toReceivedRow', () => {
  it('편지 종류를 칩 문구로 바꿔 단다', () => {
    expect(toReceivedRow(received).badge.label).toBe('답장');
  });

  it('주소는 받은 편지 상세다 — 화면은 어느 칸인지 몰라도 된다', () => {
    expect(toReceivedRow(received).href).toBe('/mailbox/received/1');
  });

  it('서버가 준 미읽음을 그대로 쓴다', () => {
    expect(toReceivedRow(received).unread).toBe(true);
    expect(toReceivedRow({ ...received, unread: false }).unread).toBe(false);
  });
});

describe('toSentRow', () => {
  it('제목은 내가 고른 유형의 이름이 된다', () => {
    // 서버도 유형 이름을 내려주지만 화면 문구는 우리가 정한다. 내가 쓴 원문은 미리보기 자리로 간다
    expect(toSentRow(sent).title).toBe('문제 신고하기');
    expect(toSentRow(sent).preview).toBe('로그인이 자꾸 풀려요.');
  });

  it('처리 상태를 칩 문구로 바꿔 단다', () => {
    expect(toSentRow(sent).badge.label).toBe('처리중');
    expect(toSentRow({ ...sent, status: 'COMPLETED' }).badge.label).toBe(
      '처리완료',
    );
  });

  it('주소는 보낸 피드백 상세다 — 받은 편지와 아이디 공간이 달라 주소도 다르다', () => {
    expect(toSentRow(sent).href).toBe('/mailbox/sent/7');
  });

  it('보낸 편지에는 미읽음이라는 개념이 없다', () => {
    expect(toSentRow(sent).unread).toBe(false);
  });

  it('보낸 시각은 작성 시각이다 — 목록이 한 줄로 같은 자리에 그린다', () => {
    expect(toSentRow(sent).sentAt).toBe(sent.createdAt);
  });
});
