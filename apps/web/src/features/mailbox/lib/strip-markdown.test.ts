// stripMarkdown — 목록 한 줄 미리보기에 마크다운 기호가 새지 않게 벗긴다
import { describe, expect, it } from 'vitest';

import { stripMarkdown } from './strip-markdown';

describe('stripMarkdown', () => {
  it('링크는 글자만, 이미지는 설명만 남긴다', () => {
    expect(
      stripMarkdown(
        '[릴리즈 노트](https://landit.im/notes) ![캡처](https://a/b.png)',
      ),
    ).toBe('릴리즈 노트 캡처');
  });

  it('제목·인용·불릿·체크박스 기호를 줄 앞에서 뗀다', () => {
    expect(stripMarkdown('## 제목\n> 인용\n- 불릿\n- [x] 체크')).toBe(
      '제목 인용 불릿 체크',
    );
  });

  it('굵게·취소선·코드 기호를 지우고 여러 줄을 한 줄로 합친다', () => {
    expect(stripMarkdown('**중요** ~~취소~~ `코드`\n\n다음 문단')).toBe(
      '중요 취소 코드 다음 문단',
    );
  });

  it('표의 세로줄과 구분선은 지우고 셀 글자만 남긴다', () => {
    expect(
      stripMarkdown('| 기기 | 결과 |\n| --- | --- |\n| iPhone | 풀림 |'),
    ).toBe('기기 결과 iPhone 풀림');
  });

  it('마크다운이 없는 평문은 그대로 둔다', () => {
    expect(stripMarkdown('로그인이 자꾸 풀려요.')).toBe(
      '로그인이 자꾸 풀려요.',
    );
  });
});
