// 받은 편지 칩 — 편지 종류를 칩으로 옮기고, 모르는 종류가 와도 화면이 깨지지 않게 한다
import { describe, expect, it } from 'vitest';

import type { MailboxLetterType } from '../api/mailbox';
import { toReceivedBadge } from './letter-badge';

describe('toReceivedBadge', () => {
  it('개인 편지는 「편지」 칩을 단다', () => {
    // Given 운영이 나에게만 보낸 편지
    // When 칩으로 옮기면
    const badge = toReceivedBadge('DIRECT');

    // Then 공지·업데이트·답장과 다른 칩이 된다
    expect(badge).toEqual({ label: '편지', tone: 'direct' });
  });

  it('모르는 종류가 오면 개인 편지와 같은 「편지」 칩으로 물러선다', () => {
    // Given 웹이 아직 모르는 새 종류
    const unknown = 'SURPRISE' as MailboxLetterType;

    // When 칩으로 옮기면
    const badge = toReceivedBadge(unknown);

    // Then 「편지」 칩이 두 모양으로 갈리지 않게 개인 편지 칩을 그대로 준다
    expect(badge).toEqual(toReceivedBadge('DIRECT'));
  });
});
