// 튜토리얼 문장 조각 — 문구 파일의 <br></br>은 줄바꿈 글자로, <em>은 금색 조각으로 바꿔 한 자씩 쓸 수 있게 한다

// 문장 조각 — 두 번째 값이 참이면 금색으로 강조한다
export type Part = readonly [text: string, highlight?: boolean];

/** 문구 원문(t.raw)을 조각으로 — 한 자씩 쓰려면 리액트 노드가 아니라 글자가 필요하다 */
export const partsOf = (raw: string): Part[] =>
  raw
    .replaceAll('<br></br>', '\n')
    .split(/<em>(.*?)<\/em>/)
    .flatMap((text, index): Part[] => {
      if (!text) return [];
      // split의 홀수 칸이 태그 안쪽이다
      return index % 2 === 1 ? [[text, true]] : [[text]];
    });
