// 말하기 속도 설정 — 기본 1배, 목록에 없는 값은 안 믿고, 바뀌면 구독자에게 알린다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getSpeechRate,
  setSpeechRate,
  SPEECH_RATES,
  subscribeSpeechRate,
} from './speech-rate';

beforeEach(() => localStorage.clear());

describe('speech rate setting', () => {
  it('아무것도 저장돼 있지 않으면 1배다', () => {
    expect(getSpeechRate()).toBe(1);
  });

  it('고른 배속이 저장되고, 1배로 되돌리면 지워진다 — 1배는 기본값이라 남길 게 없다', () => {
    setSpeechRate(0.75);
    expect(getSpeechRate()).toBe(0.75);
    expect(localStorage.getItem('landit-speech-rate')).toBe('0.75');

    setSpeechRate(1);
    expect(getSpeechRate()).toBe(1);
    expect(localStorage.getItem('landit-speech-rate')).toBeNull();
  });

  it('목록에 없는 값이 저장돼 있으면 1배로 본다 — 손댄 값이나 옛 버전 값(0.5·1.125)에 끌려가지 않게', () => {
    localStorage.setItem('landit-speech-rate', '0.5');

    expect(getSpeechRate()).toBe(1);
  });

  it('숫자가 아닌 값이 저장돼 있어도 1배로 본다', () => {
    localStorage.setItem('landit-speech-rate', 'fast');

    expect(getSpeechRate()).toBe(1);
  });

  it('목록에 없는 배속으로 바꾸려 하면 무시한다 — 저장소에 이상한 값이 들어가지 않게', () => {
    setSpeechRate(0.75);

    setSpeechRate(2 as (typeof SPEECH_RATES)[number]);

    expect(getSpeechRate()).toBe(0.75);
  });

  it('저장소를 못 읽으면 1배로 본다 — 비공개 모드에서도 재생은 기본 속도로 된다', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    try {
      expect(getSpeechRate()).toBe(1);
    } finally {
      getItem.mockRestore();
    }
  });

  it('바뀔 때마다 구독자에게 알리고, 구독을 풀면 더는 부르지 않는다', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeSpeechRate(onChange);

    setSpeechRate(1.5);
    expect(onChange).toHaveBeenCalledTimes(1);

    unsubscribe();
    setSpeechRate(0.75);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
