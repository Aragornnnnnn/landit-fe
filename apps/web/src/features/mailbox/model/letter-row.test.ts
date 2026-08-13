// 받은/보낸 편지를 같은 줄 모양으로 맞추는 변환 — 두 갈래가 제목과 미읽음을 다르게 정한다
import { describe, expect, it } from 'vitest';

import type { ReceivedLetter, SentLetter } from '../api/letter';
import { toReceivedRow, toSentRow } from './letter-row';

const received: ReceivedLetter = {
  letterId: 1,
  kind: 'REPLY',
  title: '보내주신 의견에 대한 답장',
  preview: '불편을 드려 죄송해요!',
  sentAt: '2026-08-09T02:30:00Z',
  read: false,
};

const sent: SentLetter = {
  letterId: 7,
  feedbackType: 'BUG',
  status: 'PENDING',
  preview: '로그인이 자꾸 풀려요.',
  sentAt: '2026-08-08T09:20:00Z',
};

describe('toReceivedRow', () => {
  it('편지 종류를 칩 문구로 바꿔 단다', () => {
    expect(toReceivedRow(received).badge.label).toBe('답장');
  });

  it('아직 안 읽었으면 미읽음으로 표시한다', () => {
    expect(toReceivedRow(received).unread).toBe(true);
  });

  it('읽은 편지는 미읽음 표시를 걷는다', () => {
    expect(toReceivedRow({ ...received, read: true }).unread).toBe(false);
  });
});

describe('toSentRow', () => {
  it('보낸 편지의 제목은 내가 고른 피드백 유형이 된다', () => {
    expect(toSentRow(sent).title).toBe('문제 신고하기');
  });

  it('처리 상태를 칩 문구로 바꿔 단다', () => {
    expect(toSentRow(sent).badge.label).toBe('처리중');
    expect(toSentRow({ ...sent, status: 'ANSWERED' }).badge.label).toBe(
      '처리완료',
    );
  });

  it('보낸 편지에는 미읽음이라는 개념이 없다', () => {
    expect(toSentRow(sent).unread).toBe(false);
  });
});
