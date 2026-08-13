// 읽음 처리를 보낼지 말지 — 보내면 안 되는 두 경우가 계약이다
import { describe, expect, it } from 'vitest';

import type { LetterDetail } from '../api/letter-detail';
import { needsReadMark } from './letter-read';

const notice = (read: boolean): LetterDetail => ({
  letterId: 1,
  kind: 'NOTICE',
  title: '우리가 앱을 만든 이유',
  sentAt: '2026-08-01T01:00:00Z',
  blocks: [],
  read,
});

describe('needsReadMark', () => {
  it('안 읽은 받은 편지는 읽음으로 알린다', () => {
    expect(needsReadMark(notice(false))).toBe(true);
  });

  it('이미 읽은 편지는 다시 알리지 않는다', () => {
    expect(needsReadMark(notice(true))).toBe(false);
  });

  it('내가 보낸 편지에는 읽음이라는 개념이 없다', () => {
    const sent: LetterDetail = {
      letterId: 11,
      kind: 'FEEDBACK',
      feedbackType: 'FEATURE',
      status: 'PENDING',
      sentAt: '2026-08-08T09:20:00Z',
      content: '다크모드 지원해주세요.',
      reply: null,
    };

    expect(needsReadMark(sent)).toBe(false);
  });
});
