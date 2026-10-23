// 이벤트 공지 순서 — 공지가 다른 안내를 붙잡는 때와, 공지 자신이 다른 것을 기다리는 때를 가르는 규칙 검증
import { describe, expect, it } from 'vitest';

import { eventPopupOrder } from './event-popup-order';

const base = {
  loading: false,
  hasPopup: false,
  closed: false,
  updateFirst: false,
  promoOpen: false,
  showerHold: false,
};

describe('eventPopupOrder', () => {
  it.each([
    ['공지 응답을 기다리는 중이면', { loading: true }, true],
    ['띄울 공지가 있고 아직 안 닫혔으면', { hasPopup: true }, true],
    ['공지를 닫았으면', { hasPopup: true, closed: true }, false],
    ['띄울 공지가 없으면', {}, false],
  ])('%s 다른 안내를 붙잡을지 정한다', (_, given, pending) => {
    expect(eventPopupOrder({ ...base, ...given }).pending).toBe(pending);
  });

  it.each([
    ['강제 업데이트가 먼저면', { updateFirst: true }],
    ['할인 시트가 떠 있으면', { promoOpen: true }],
    ['동전 연출이 도는 중이면', { showerHold: true }],
  ])('%s 공지는 차례를 기다린다', (_, given) => {
    expect(eventPopupOrder({ ...base, ...given }).ready).toBe(false);
  });

  it('앞선 것이 없으면 공지가 나설 수 있다', () => {
    expect(eventPopupOrder(base).ready).toBe(true);
  });
});
