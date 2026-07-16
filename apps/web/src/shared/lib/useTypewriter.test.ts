// 타자기 스텝 로직 — 타이핑·홀드·삭제 전이와 마지막 문구 고정 검증
import { describe, expect, it } from 'vitest';

import {
  initialTypewriterState,
  stepTypewriter,
  typewriterText,
  type TypewriterState,
} from './useTypewriter';

// 상태를 n틱 전진시키며 매 틱의 표시 문자열을 수집한다
const run = (phrases: string[], holdTicks: number, ticks: number) => {
  let state = initialTypewriterState;
  const frames: string[] = [typewriterText(state, phrases)];
  for (let i = 0; i < ticks; i++) {
    state = stepTypewriter(state, phrases, holdTicks);
    frames.push(typewriterText(state, phrases));
  }
  return { state, frames };
};

describe('stepTypewriter', () => {
  it('단일 문구를 한 글자씩 치고 마지막에서 done으로 멈춘다', () => {
    const { state, frames } = run(['ab'], 0, 4);

    expect(frames).toEqual(['', 'a', 'ab', 'ab', 'ab']);
    expect(state.mode).toBe('done');
  });

  it('앞 문구는 홀드 후 지우고 다음 문구로 넘어간다', () => {
    const { frames } = run(['hi', 'yo'], 1, 20);

    // hi 타이핑 → 홀드 → 삭제 → yo 타이핑 순서로 문자열이 흐른다
    expect(frames).toContain('hi');
    expect(frames).toContain('h');
    expect(frames).toContain('yo');
    // 첫 문구를 완전히 지운 뒤(빈 문자열) 다음 문구가 시작된다
    const emptyAfterHi = frames.indexOf('', frames.indexOf('hi'));
    expect(emptyAfterHi).toBeGreaterThan(-1);
  });

  it('마지막 문구에 도달하면 done 이후로는 상태가 변하지 않는다', () => {
    const { state } = run(['x', 'final'], 2, 40);
    const frozen = stepTypewriter(state, ['x', 'final'], 2);

    expect(state.mode).toBe('done');
    expect(typewriterText(state, ['x', 'final'])).toBe('final');
    expect(frozen).toEqual(state);
  });

  it('done 상태는 phrases가 비어도 안전하게 유지된다', () => {
    const done: TypewriterState = {
      phraseIndex: 0,
      charCount: 0,
      mode: 'done',
      holdTicks: 0,
    };
    expect(stepTypewriter(done, [], 5)).toEqual(done);
  });
});
