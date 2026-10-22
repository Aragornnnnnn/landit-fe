// 이벤트 공지 — 이 기기에서 반응한 공지를 거르고, 링크를 앱 안 이동과 바깥 열기로 가르는 규칙 검증
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import type { ActivePopup } from '../api/event-popup';
import {
  markEventPopupDone,
  popupLinkTarget,
  readEventPopupDoneIds,
  unseenPopup,
} from './active-popup';

const POPUP: ActivePopup = {
  popupId: 7,
  imageUrl: 'https://cdn.landit.im/popup/7.webp',
  linkUrl: '/mailbox/received/12',
};

describe('unseenPopup', () => {
  it('서버가 준 공지에 아직 반응하지 않았으면 그대로 띄운다', () => {
    expect(unseenPopup(POPUP, [])).toBe(POPUP);
  });

  it('이미 반응한 공지면 띄우지 않는다', () => {
    expect(unseenPopup(POPUP, [7])).toBeNull();
  });

  it.each([
    ['띄울 공지가 없다고 하면', null],
    ['아직 응답이 없으면', undefined],
  ])('%s 띄우지 않는다', (_, popup) => {
    expect(unseenPopup(popup, [])).toBeNull();
  });
});

describe('popupLinkTarget', () => {
  it('앱 안 경로면 화면을 옮긴다', () => {
    expect(popupLinkTarget('/mailbox/received/12')).toEqual({
      kind: 'app',
      path: '/mailbox/received/12',
    });
  });

  it('https 주소면 바깥 브라우저로 연다', () => {
    expect(popupLinkTarget('https://landit.im/event')).toEqual({
      kind: 'external',
      url: 'https://landit.im/event',
    });
  });

  it.each([
    ['링크가 없으면', null],
    ['//로 시작하는 다른 사이트 주소면', '//evil.example'],
    ['허용하지 않는 형식이면', 'javascript:alert(1)'],
  ])('%s 누를 곳을 만들지 않는다', (_, linkUrl) => {
    expect(popupLinkTarget(linkUrl)).toBeNull();
  });
});

describe('반응한 기록', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('반응한 공지가 기록에 쌓인다', () => {
    markEventPopupDone(1);
    markEventPopupDone(2);

    expect(readEventPopupDoneIds()).toEqual([1, 2]);
  });
});
