// 대화 표시 설정 — 상대 말 글자로 보기(기본 켬)·해석 항상 보기(기본 끔)의 기본값·저장·알림 계약을 검증한다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDisplaySetting,
  setDisplaySetting,
  subscribeDisplaySettings,
} from './talk-display';

beforeEach(() => localStorage.clear());

describe('대화 표시 설정', () => {
  it('아무것도 저장돼 있지 않으면 영어 문장은 보이고 해석은 접혀 있다', () => {
    expect(getDisplaySetting('showText')).toBe(true);
    expect(getDisplaySetting('alwaysShowTranslation')).toBe(false);
  });

  it('바꾼 값이 저장되고, 기본값으로 되돌리면 지워진다', () => {
    setDisplaySetting('showText', false);
    expect(getDisplaySetting('showText')).toBe(false);
    expect(localStorage.getItem('landit-talk-show-text')).toBe('false');

    setDisplaySetting('showText', true);
    expect(getDisplaySetting('showText')).toBe(true);
    expect(localStorage.length).toBe(0);
  });

  it('두 설정은 서로 따로 저장된다', () => {
    setDisplaySetting('alwaysShowTranslation', true);

    expect(getDisplaySetting('alwaysShowTranslation')).toBe(true);
    expect(getDisplaySetting('showText')).toBe(true);
  });

  it('값이 바뀌면 구독자에게 알리고, 구독을 끊으면 더 알리지 않는다', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeDisplaySettings(onChange);

    setDisplaySetting('showText', false);
    unsubscribe();
    setDisplaySetting('showText', true);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
