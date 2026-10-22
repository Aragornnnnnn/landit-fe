// EventPopupGate — 띄운 공지에 반응하면 다시 안 뜨고, 자세히 보기만 공지 화면으로 보내는 계약 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { isEventPopupDone } from '../model/active-popup';
import type { EventPopup } from '../model/event-popups';
import { EventPopupGate } from './EventPopupGate';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
const trackMock = vi.mocked(track);

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const POPUP: EventPopup = {
  popupId: 'invite-2026-10',
  imageUrl: '/images/event/invite.webp',
  imageAlt: '친구 초대 이벤트',
  linkUrl: '/mailbox/letters/12',
  startAt: '2026-10-20T00:00:00+09:00',
  endAt: '2026-11-01T00:00:00+09:00',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('EventPopupGate', () => {
  it('띄우면 어느 공지가 보였는지 계측한다', () => {
    render(<EventPopupGate popup={POPUP} />);

    expect(trackMock).toHaveBeenCalledWith('Event Popup Viewed', {
      popup_id: 'invite-2026-10',
    });
  });

  it.each([
    ['자세히 보기', () => screen.getByRole('button', { name: '자세히 보기' })],
    ['이미지', () => screen.getByRole('button', { name: '친구 초대 이벤트' })],
  ])('%s를 누르면 공지 화면으로 가고 다시 띄우지 않는다', (_, target) => {
    render(<EventPopupGate popup={POPUP} />);

    fireEvent.click(target());

    expect(push).toHaveBeenCalledWith('/mailbox/letters/12');
    expect(isEventPopupDone('invite-2026-10')).toBe(true);
  });

  it('닫기를 누르면 이동 없이 닫고 다시 띄우지 않는다', () => {
    render(<EventPopupGate popup={POPUP} />);

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(isEventPopupDone('invite-2026-10')).toBe(true);
  });
});
