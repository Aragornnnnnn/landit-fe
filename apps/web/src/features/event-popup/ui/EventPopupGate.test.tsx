// EventPopupGate — 띄운 공지에 반응하면 다시 안 뜨고, 링크가 있을 때만 자세히 보기로 공지 화면에 보내는 계약 검증
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import type { ActivePopup } from '../api/event-popup';
import { readEventPopupDoneIds } from '../model/active-popup';
import { EventPopupGate } from './EventPopupGate';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
const trackMock = vi.mocked(track);

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const POPUP: ActivePopup = {
  popupId: 7,
  imageUrl: 'https://cdn.landit.im/popup/7.webp',
  linkUrl: '/mailbox/received/12',
};

// 홈 탭처럼 열림을 쥐고 있는 쪽 — 닫으면 open을 내린다
const Host = ({ popup = POPUP }: { popup?: ActivePopup }) => {
  const [open, setOpen] = useState(true);
  return (
    <EventPopupGate popup={popup} open={open} onClose={() => setOpen(false)} />
  );
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('EventPopupGate', () => {
  it('띄우면 어느 공지가 보였는지 계측한다', () => {
    render(<Host />);

    expect(trackMock).toHaveBeenCalledWith('Event Popup Viewed', {
      popup_id: 7,
    });
  });

  it.each([
    ['자세히 보기', () => screen.getByRole('button', { name: '자세히 보기' })],
    ['이미지', () => screen.getByRole('button', { name: '이벤트 공지' })],
  ])('%s를 누르면 공지 화면으로 가고 다시 띄우지 않는다', (_, target) => {
    render(<Host />);

    fireEvent.click(target());

    expect(push).toHaveBeenCalledWith('/mailbox/received/12');
    expect(readEventPopupDoneIds()).toEqual([7]);
  });

  it('닫기를 누르면 이동 없이 닫고 다시 띄우지 않는다', () => {
    render(<Host />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(readEventPopupDoneIds()).toEqual([7]);
  });

  it('링크가 없는 공지면 자세히 보기 없이 닫기만 남는다', () => {
    render(<Host popup={{ ...POPUP, linkUrl: null }} />);

    expect(
      screen.queryByRole('button', { name: '자세히 보기' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '이벤트 공지' }),
    ).not.toBeInTheDocument();
  });
});
