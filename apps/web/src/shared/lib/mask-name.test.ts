// 닉네임 가리기 규칙 검증
import { describe, expect, it } from 'vitest';

import { maskName } from './mask-name';

describe('maskName', () => {
  it('짧은 이름은 첫 글자만 남기고 가린다', () => {
    expect(maskName('마먀먀먀')).toBe('마***');
    expect(maskName('리움07')).toBe('리***');
  });

  it('다섯 글자 넘는 이름은 앞 두 글자를 남긴다', () => {
    expect(maskName('qwaszx96')).toBe('qw******');
  });

  it('한 글자 이름도 가려진 자리가 하나는 생긴다', () => {
    expect(maskName('김')).toBe('김*');
  });
});
