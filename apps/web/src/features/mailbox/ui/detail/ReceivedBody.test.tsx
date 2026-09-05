// ReceivedBody — 공지·업데이트는 블록 본문으로, 답장은 마크다운으로 그린다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { ReceivedLetterDetail } from '../../api/mailbox';
import { ReceivedBody } from './ReceivedBody';

afterEach(cleanup);

const reply: ReceivedLetterDetail = {
  letterId: 201,
  letterType: 'REPLY',
  title: '답장',
  contentBlocks: null,
  bodyText: '[릴리즈 노트](https://landit.im/notes)에서 확인해요.',
  pinned: false,
  sentAt: '2026-08-09T10:00:00',
  readAt: null,
  feedbackType: 'BUG_REPORT',
  quotedFeedbackContent: '로그인이 자꾸 풀려요.',
};

describe('ReceivedBody', () => {
  it('답장 본문의 마크다운 링크를 링크로 그린다', () => {
    render(<ReceivedBody letter={reply} />);

    expect(
      screen.getByRole('link', { name: '릴리즈 노트' }).getAttribute('href'),
    ).toBe('https://landit.im/notes');
  });

  it('블록 본문이 있으면 bodyText 대신 블록을 그린다', () => {
    render(
      <ReceivedBody
        letter={{
          ...reply,
          letterType: 'NOTICE',
          contentBlocks: [{ type: 'PARAGRAPH', text: '공지 본문' }],
          bodyText: '답장 본문',
          quotedFeedbackContent: null,
        }}
      />,
    );

    expect(screen.getByText('공지 본문')).toBeTruthy();
    expect(screen.queryByText('답장 본문')).toBeNull();
  });
});
