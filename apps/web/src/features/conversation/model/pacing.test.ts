// 발화 페이싱 — 음성이 없을 때 쓰는 추정 시간이 말하기 속도 설정을 따라가고, 속마음 기다림은 보낸 순간부터 센다
import { describe, expect, it } from 'vitest';

import { speechTypingMs, thoughtWaitLeftMs, thoughtWaitMs } from './pacing';

describe('speechTypingMs', () => {
  it('배속을 주지 않으면 1배 기준으로 센다', () => {
    const text = '이건 스무 글자가 넘는 제법 긴 문장이다';

    expect(speechTypingMs(text, 1)).toBe(speechTypingMs(text));
  });

  it('0.5배면 두 배로 길어지고 1.5배면 그만큼 짧아진다', () => {
    const text = '이건 스무 글자가 넘는 제법 긴 문장이다';
    const base = speechTypingMs(text);

    expect(speechTypingMs(text, 0.5)).toBe(base * 2);
    expect(speechTypingMs(text, 1.5)).toBe(base / 1.5);
  });

  it('짧은 문장의 최소 시간도 배속을 따른다 — 느리게 골랐는데 짧은 말만 그대로면 어긋난다', () => {
    const short = '응';

    expect(speechTypingMs(short)).toBe(1400);
    expect(speechTypingMs(short, 0.5)).toBe(2800);
  });
});

describe('thoughtWaitLeftMs', () => {
  it('보낸 지 얼마 안 됐으면 상한에서 지난 시간만큼 뺀 만큼 더 기다린다', () => {
    expect(thoughtWaitLeftMs(1000, 2000)).toBe(thoughtWaitMs - 1000);
  });

  it('대답이 상한보다 늦게 왔으면 더 기다리지 않는다', () => {
    expect(thoughtWaitLeftMs(1000, 1000 + thoughtWaitMs + 500)).toBe(0);
  });
});
