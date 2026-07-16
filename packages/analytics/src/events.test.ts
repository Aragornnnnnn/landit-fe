// 이벤트명 네이밍 컨벤션 계약 — Title Case·과거형·중복 금지·동적 값 금지를 코드로 강제한다
import { describe, expect, it } from 'vitest';

import { EVENTS } from './events';

const names = Object.values(EVENTS);

describe('EVENTS 네이밍 컨벤션', () => {
  it('이벤트가 하나 이상 등록돼 있다', () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it('모든 이벤트명이 Title Case + 공백 형식이다 (약어는 전부 대문자 허용)', () => {
    for (const name of names) {
      for (const word of name.split(' ')) {
        expect(word, `"${name}"의 단어 "${word}"`).toMatch(
          /^([A-Z][a-z]+|[A-Z]{2,})$/,
        );
      }
    }
  });

  it('모든 이벤트명이 과거형 동사로 끝난다', () => {
    for (const name of names) {
      const words = name.split(' ');
      const lastWord = words[words.length - 1];
      expect(lastWord, `"${name}"의 마지막 단어`).toMatch(/ed$/);
    }
  });

  it('이벤트명이 서로 중복되지 않는다', () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it('이벤트명에 동적 값(숫자)이 들어가지 않는다', () => {
    for (const name of names) {
      expect(name, `"${name}"`).not.toMatch(/\d/);
    }
  });
});
