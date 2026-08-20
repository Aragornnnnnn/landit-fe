// MailboxTabs — 칸을 알리는 조건. 이미 열린 칸을 눌러도 아무 일이 없어야 한다
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MailboxTabs } from './MailboxTabs';

afterEach(cleanup);

describe('MailboxTabs', () => {
  it('다른 칸을 누르면 그 칸을 알린다', async () => {
    const selectBox = vi.fn();
    render(<MailboxTabs current="received" onSelect={selectBox} />);

    await userEvent.click(screen.getByRole('button', { name: '보낸 편지' }));

    expect(selectBox).toHaveBeenCalledWith('sent');
  });

  it('이미 열린 칸을 누르면 알리지 않는다', async () => {
    const selectBox = vi.fn();
    render(<MailboxTabs current="received" onSelect={selectBox} />);

    await userEvent.click(screen.getByRole('button', { name: '받은 편지' }));

    expect(selectBox).not.toHaveBeenCalled();
  });
});
