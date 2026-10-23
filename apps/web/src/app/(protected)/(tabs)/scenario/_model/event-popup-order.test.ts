// 이벤트 공지 순서 — 공지를 건너뛸 방문, 공지가 시트를 붙잡는 때, 공지가 램프 등 앞선 것을 기다리는 때를 가르는 규칙 검증
import { describe, expect, it } from 'vitest';

import { eventPopupOrder, skipsEventPopup } from './event-popup-order';

describe('skipsEventPopup', () => {
  const quiet = {
    onboarded: false,
    previewTurn: false,
    satisfactionTurn: false,
  };

  it.each([
    ['온보딩을 막 마치고 왔으면', { onboarded: true }],
    ['프리미엄 프리뷰(튜토리얼·무료 표현) 차례면', { previewTurn: true }],
    ['소감·리뷰 시트가 나설 방문이면', { satisfactionTurn: true }],
  ])('%s 이번 방문엔 공지를 건너뛴다', (_, given) => {
    expect(skipsEventPopup({ ...quiet, ...given })).toBe(true);
  });

  it('아무것도 나서지 않는 방문이면 공지를 띄운다', () => {
    expect(skipsEventPopup(quiet)).toBe(false);
  });
});

describe('eventPopupOrder', () => {
  const base = {
    loading: false,
    hasPopup: false,
    closed: false,
    previewDeciding: false,
    lampSettled: true,
    updateFirst: false,
    promoOpen: false,
    showerHold: false,
  };

  it.each([
    ['공지 응답을 기다리는 중이면', { loading: true }, true],
    ['프리뷰 대상인지 아직 모르면', { previewDeciding: true }, true],
    ['띄울 공지가 있고 아직 안 닫혔으면', { hasPopup: true }, true],
    ['공지를 닫았으면', { hasPopup: true, closed: true }, false],
    ['띄울 공지가 없으면', {}, false],
  ])('%s 다른 안내를 붙잡을지 정한다', (_, given, pending) => {
    expect(eventPopupOrder({ ...base, ...given }).pending).toBe(pending);
  });

  it.each([
    ['강제 업데이트가 먼저면', { updateFirst: true }],
    ['램프가 묻는 중이거나 물을지 아직 모르면', { lampSettled: false }],
    ['프리뷰 대상인지 아직 모르면', { previewDeciding: true }],
    ['할인 시트가 떠 있으면', { promoOpen: true }],
    ['동전 연출이 도는 중이면', { showerHold: true }],
  ])('%s 공지는 차례를 기다린다', (_, given) => {
    expect(eventPopupOrder({ ...base, ...given }).ready).toBe(false);
  });

  it('앞선 것이 없으면 공지가 나설 수 있다', () => {
    expect(eventPopupOrder(base).ready).toBe(true);
  });
});
