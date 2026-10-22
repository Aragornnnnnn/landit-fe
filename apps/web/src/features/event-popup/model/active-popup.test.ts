// 이벤트 팝업 고르기 — 노출 기간·반응한 기록으로 이번에 띄울 팝업 하나를 고르는 규칙 검증
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  isEventPopupDone,
  markEventPopupDone,
  pickActivePopup,
} from './active-popup';
import type { EventPopup } from './event-popups';

const popup = (overrides: Partial<EventPopup> = {}): EventPopup => ({
  popupId: 'invite-2026-10',
  imageUrl: '/images/event/invite.webp',
  imageAlt: '친구 초대 이벤트',
  linkUrl: '/mailbox',
  startAt: '2026-10-20T00:00:00+09:00',
  endAt: '2026-11-01T00:00:00+09:00',
  ...overrides,
});

const NOW = new Date('2026-10-22T12:00:00+09:00');
const neverDone = () => false;

describe('pickActivePopup', () => {
  it('노출 기간 안의 반응하지 않은 팝업을 고른다', () => {
    const target = popup();

    const picked = pickActivePopup([target], NOW, neverDone);

    expect(picked).toBe(target);
  });

  it.each([
    ['시작 전', { startAt: '2026-10-23T00:00:00+09:00' }],
    ['끝난 뒤', { endAt: '2026-10-22T12:00:00+09:00' }],
  ])('%s이면 고르지 않는다', (_, period) => {
    const picked = pickActivePopup([popup(period)], NOW, neverDone);

    expect(picked).toBeNull();
  });

  it('이미 반응한 팝업은 건너뛰고 다음 팝업을 고른다', () => {
    const done = popup({ popupId: 'old' });
    const next = popup({ popupId: 'new' });

    const picked = pickActivePopup([done, next], NOW, (id) => id === 'old');

    expect(picked).toBe(next);
  });

  it('조건에 맞는 팝업이 여럿이면 목록 앞의 것을 고른다', () => {
    const first = popup({ popupId: 'first' });

    const picked = pickActivePopup(
      [first, popup({ popupId: 'second' })],
      NOW,
      neverDone,
    );

    expect(picked).toBe(first);
  });
});

describe('반응한 기록', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('반응한 팝업만 기록에 남는다', () => {
    markEventPopupDone('a');

    expect([isEventPopupDone('a'), isEventPopupDone('b')]).toEqual([
      true,
      false,
    ]);
  });

  it('여러 개에 반응하면 앞선 기록도 남는다', () => {
    markEventPopupDone('a');
    markEventPopupDone('b');

    expect(isEventPopupDone('a')).toBe(true);
  });
});
