// 본문 블록 읽기 검증 — 서버는 자유 JSON을 내려주므로 아는 모양만 골라내는 게 계약이다
import { describe, expect, it } from 'vitest';

import { readLetterBlocks } from './letter-blocks';

describe('readLetterBlocks', () => {
  it('아는 블록 세 종류는 그대로 통과한다', () => {
    const blocks = [
      { type: 'PARAGRAPH', text: '안녕하세요' },
      { type: 'IMAGE', url: 'https://x/a.png', caption: '설명' },
      { type: 'ORDERED_LIST', items: ['하나', '둘'] },
    ];

    expect(readLetterBlocks(blocks)).toEqual(blocks);
  });

  it('이미지의 caption은 없거나 null이어도 통과한다 — JSON에는 undefined가 없어 "없음"이 null로 온다', () => {
    const blocks = [
      { type: 'IMAGE', url: 'https://x/a.png' },
      { type: 'IMAGE', url: 'https://x/b.png', caption: null },
    ];

    expect(readLetterBlocks(blocks)).toEqual(blocks);
  });

  it('모르는 타입이나 모양이 어긋난 블록은 건너뛰고 나머지는 살린다', () => {
    const blocks = [
      { type: 'PARAGRAPH', text: '살아남는다' },
      { type: 'VIDEO', url: 'https://x/v.mp4' },
      { type: 'PARAGRAPH' },
      { type: 'ORDERED_LIST', items: 'not-an-array' },
      'garbage',
    ];

    expect(readLetterBlocks(blocks)).toEqual([
      { type: 'PARAGRAPH', text: '살아남는다' },
    ]);
  });

  it('이미지 url이 비어 있어도 통과한다 — 아직 그림이 없는 자리를 잡아 두는 블록이다', () => {
    const blocks = [{ type: 'IMAGE', url: '', caption: '일러스트 자리' }];

    expect(readLetterBlocks(blocks)).toEqual(blocks);
  });

  it('배열이 아니면 빈 목록이다', () => {
    expect(readLetterBlocks(null)).toEqual([]);
    expect(readLetterBlocks({ type: 'PARAGRAPH', text: '홀로' })).toEqual([]);
    expect(readLetterBlocks('text')).toEqual([]);
  });
});
