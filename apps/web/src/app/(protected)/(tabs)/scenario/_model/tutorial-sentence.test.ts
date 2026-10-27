// 튜토리얼 문장 조각 — 문구 파일의 줄바꿈·강조 태그를 한 자씩 쓸 수 있는 조각으로 바꾼다
import { describe, expect, it } from 'vitest';

import { partsOf } from './tutorial-sentence';

describe('partsOf', () => {
  it('강조 태그 안은 강조 조각, 밖은 보통 조각으로 나눈다', () => {
    expect(partsOf('매일 <em>시나리오를</em> 드려요')).toEqual([
      ['매일 '],
      ['시나리오를', true],
      [' 드려요'],
    ]);
  });

  it('줄바꿈 태그는 줄바꿈 글자로 바꾼다 — 한 자씩 쓰는 동안에도 줄이 그대로 바뀐다', () => {
    expect(
      partsOf('매일 이렇게<br></br><em>하나씩</em><br></br>드려요'),
    ).toEqual([['매일 이렇게\n'], ['하나씩', true], ['\n드려요']]);
  });

  it('강조로 시작하거나 끝나도 빈 조각을 만들지 않는다', () => {
    expect(partsOf('<em>무료</em>')).toEqual([['무료', true]]);
  });
});
