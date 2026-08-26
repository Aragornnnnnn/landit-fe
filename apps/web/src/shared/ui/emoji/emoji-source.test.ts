import { describe, expect, it } from 'vitest';

import { extractEmoji, toSvgFileName } from './emoji-source';

describe('extractEmoji', () => {
  it('소스에 섞인 이모지만 골라낸다', () => {
    const source = `<span className="tossface">💬</span> 대화하기`;

    expect(extractEmoji(source)).toEqual(['💬']);
  });

  it('같은 이모지가 여러 번 나와도 한 번만 담는다', () => {
    const source = '💬 어쩌고 💬 저쩌고 💡';

    expect(extractEmoji(source)).toEqual(['💬', '💡']);
  });

  it('표기 선택자가 붙은 이모지는 선택자까지 한 덩어리로 본다', () => {
    expect(extractEmoji('✉️ 편지')).toEqual(['✉️']);
  });

  it('국기처럼 두 글자가 합쳐지는 이모지는 쪼개지 않는다', () => {
    expect(extractEmoji('🇺🇸 미국')).toEqual(['🇺🇸']);
  });

  it('이모지가 없으면 빈 배열을 준다', () => {
    expect(extractEmoji('그냥 한글과 English 123')).toEqual([]);
  });

  it('글자로 쓰이는 기호는 이모지로 보지 않는다', () => {
    expect(extractEmoji('주소 조각 ↔ 피드백 유형')).toEqual([]);
  });

  it('기본이 그림인 기호는 표기 선택자가 없어도 이모지로 본다', () => {
    expect(extractEmoji('✅ 통과')).toEqual(['✅']);
  });

  it('ZWJ로 이어 붙인 이모지는 한 덩어리로 본다', () => {
    expect(extractEmoji('😵‍💫 어질어질')).toEqual(['😵‍💫']);
  });
});

describe('toSvgFileName', () => {
  it('코드포인트를 대문자 16진수로 바꿔 파일명을 만든다', () => {
    expect(toSvgFileName('💬')).toBe('u1F4AC.svg');
  });

  it('합쳐지는 이모지는 코드포인트를 밑줄로 잇는다', () => {
    expect(toSvgFileName('🇺🇸')).toBe('u1F1FA_u1F1F8.svg');
  });

  it('표기 선택자는 파일명에서 뺀다', () => {
    expect(toSvgFileName('✉️')).toBe('u2709.svg');
  });

  it('숫자는 코드포인트가 아니라 토스가 쓰는 영어 이름으로 찾는다', () => {
    expect(toSvgFileName('1')).toBe('one.svg');
    expect(toSvgFileName('5')).toBe('five.svg');
  });
});
