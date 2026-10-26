// 답변 입력에서 영어 대화에 필요 없는 글자를 걸러 내는 규칙 검증
import { describe, expect, it } from 'vitest';

import { removeNonEnglish } from './english-only';

describe('removeNonEnglish', () => {
  it.each([
    ['완성된 한글', '안녕 hello', ' hello'],
    ['조합 중 남은 자모', 'helloㅎ', 'hello'],
    ['영어 사이에 낀 한글', 'I am 학생 now', 'I am  now'],
    ['이모지', 'nice 👍', 'nice '],
    [
      '대화에 안 쓰는 기호',
      'a@b#c*d_e<f>g[h]i{j}k|l\\m~n^o',
      'abcdefghijklmno',
    ],
  ])('%s는 지운다', (_, input, expected) => {
    expect(removeNonEnglish(input)).toBe(expected);
  });

  it('영어·숫자·공백과 문장에 쓰는 부호는 그대로 둔다', () => {
    const text = "It's 3 o'clock, isn't it?\nYes! A well-known \"place\".";

    expect(removeNonEnglish(text)).toBe(text);
  });

  it('시간·가격·퍼센트에 쓰는 기호는 그대로 둔다', () => {
    // 음성 인식 결과를 고쳐 쓸 때 5:30이 530으로 바뀌어 보내지면 안 된다
    const text = 'See you at 5:30. It costs $20, 50% off.';

    expect(removeNonEnglish(text)).toBe(text);
  });

  it('인식기가 적어 주는 악센트 문자는 그대로 둔다', () => {
    // café가 caf로 잘려 보내지면 안 된다
    const text = 'A café résumé, naïve José';

    expect(removeNonEnglish(text)).toBe(text);
  });

  it('분해형으로 들어온 악센트 문자도 악센트를 잃지 않는다', () => {
    // e + 결합 악센트(U+0301)로 들어오면 결합 악센트만 지워져 e가 된다
    expect(removeNonEnglish('cafe\u0301')).toBe('caf\u00e9');
  });

  it('흔히 쓰는 괄호·빗금·앰퍼샌드 같은 기호는 그대로 둔다', () => {
    const text = 'Q&A (24/7); 1+1 costs £5 or €6';

    expect(removeNonEnglish(text)).toBe(text);
  });

  it('iOS가 바꿔 넣는 말줄임표·대시·여는 따옴표도 그대로 둔다', () => {
    // ...은 …로, --는 —로, 여는 '는 ‘로 바뀐다
    const text = 'Well… I mean — it’s ‘fine’ – really';

    expect(removeNonEnglish(text)).toBe(text);
  });

  it('iOS가 바꿔 넣는 둥근 따옴표도 그대로 둔다', () => {
    // 아이폰 키보드는 기본으로 '를 ’로 바꾼다 — 막으면 I’m이 Im이 된다
    const text = 'I’m “fine”';

    expect(removeNonEnglish(text)).toBe(text);
  });
});
