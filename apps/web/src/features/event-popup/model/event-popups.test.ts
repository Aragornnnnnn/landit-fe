// 이벤트 공지 목록 — 환경변수에 편지 번호가 있을 때만 공지가 켜지는 계약 검증
import { describe, expect, it } from 'vitest';

import { buildEventPopups } from './event-popups';

describe('buildEventPopups', () => {
  it.each([
    ['없으면', undefined],
    ['비어 있으면', ''],
    ['숫자가 아니면', 'abc'],
  ])('편지 번호가 %s 공지를 띄우지 않는다', (_, letterId) => {
    expect(buildEventPopups(letterId)).toEqual([]);
  });

  it('편지 번호가 있으면 그 편지로 가는 공지를 띄운다', () => {
    const [popup] = buildEventPopups('12');

    expect(popup.linkUrl).toBe('/mailbox/received/12');
  });

  it('편지 번호가 바뀌면 새 공지로 본다 — 앞 공지를 닫은 사람에게도 다시 뜨게', () => {
    const [before] = buildEventPopups('12');
    const [after] = buildEventPopups('13');

    expect(before.popupId).not.toBe(after.popupId);
  });
});
