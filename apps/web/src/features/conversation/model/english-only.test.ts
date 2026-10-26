// 답변 입력에서 영어 대화에 필요 없는 글자를 걸러 내는 규칙 검증
import { describe, expect, it } from 'vitest';

import { removeNonEnglish } from './english-only';

describe('removeNonEnglish', () => {
  it.each([
    ['완성된 한글', '안녕 hello', ' hello'],
    ['조합 중 남은 자모', 'helloㅎ', 'hello'],
    ['영어 사이에 낀 한글', 'I am 학생 now', 'I am  now'],
    ['이모지', 'nice 👍', 'nice '],
    ['대화에 안 쓰는 기호', 'a@b#c$d%e&f*', 'abcdef'],
  ])('%s는 지운다', (_, input, expected) => {
    expect(removeNonEnglish(input)).toBe(expected);
  });

  it('영어·숫자·공백과 문장에 쓰는 부호는 그대로 둔다', () => {
    const text = "It's 3 o'clock, isn't it?\nYes! A well-known \"place\".";

    expect(removeNonEnglish(text)).toBe(text);
  });

  it('iOS가 바꿔 넣는 둥근 따옴표도 그대로 둔다', () => {
    // 아이폰 키보드는 기본으로 '를 ’로 바꾼다 — 막으면 I’m이 Im이 된다
    const text = 'I’m “fine”';

    expect(removeNonEnglish(text)).toBe(text);
  });
});
