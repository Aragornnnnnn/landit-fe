// SentBody — "읽고 있어요" 안내는 처리 상태(status)로 정한다. 묶음 답장은 replies 없이 COMPLETED가 될 수 있다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { SentFeedbackDetail } from '../../api/mailbox';
import { SentBody } from './SentBody';

afterEach(cleanup);

const pending: SentFeedbackDetail = {
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

describe('SentBody', () => {
  it('아직 처리 전(PENDING)이면 읽고 있다는 안내를 보여준다', () => {
    render(<SentBody feedback={pending} />);

    expect(screen.getByText('랜딧 팀이 읽고 있어요')).toBeTruthy();
  });

  it('처리됐지만(COMPLETED) 답장이 안 붙어 있으면 — 묶음 답장 — 읽고 있다는 안내를 보이지 않는다', () => {
    render(
      <SentBody
        feedback={{ ...pending, status: 'COMPLETED', resolvedByFeedbackId: 3 }}
      />,
    );

    expect(screen.queryByText('랜딧 팀이 읽고 있어요')).toBeNull();
  });

  it('답장이 붙어 있으면 답장을 보여주고 안내는 보이지 않는다', () => {
    render(
      <SentBody
        feedback={{
          ...pending,
          status: 'COMPLETED',
          replies: [
            {
              letterId: 201,
              title: '답장',
              bodyText: '확인해서 고쳤어요.',
              sentAt: '2026-08-09T10:00:00',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('확인해서 고쳤어요.')).toBeTruthy();
    expect(screen.queryByText('랜딧 팀이 읽고 있어요')).toBeNull();
  });
});
