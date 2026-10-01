// 문장 속 강조할 구절을 앞·구절·뒤로 자른다 — 스몰톡 대화 보기의 밑줄, 성장·배운 표현 카드의 강조가 같은 자르기를 쓴다
export interface MatchedSplit {
  before: string;
  match: string;
  after: string;
}

// 낱말로 서 있는 자리인가 — 앞뒤가 글자·숫자가 아니어야 한다.
// 실수 기억 카드의 강조 구절은 "go" 같은 낱말 하나라, 그냥 찾으면 "got" 안쪽에 걸린다
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const standsAlone = (content: string, start: number, length: number) => {
  const before = content[start - 1];
  const after = content[start + length];
  return (
    (before === undefined || !WORD_CHARACTER.test(before)) &&
    (after === undefined || !WORD_CHARACTER.test(after))
  );
};

// 원문 안에서 강조할 구절을 찾아 앞·구절·뒤로 나눈다. 낱말로 선 자리를 먼저 고르고,
// 그런 자리가 없으면 파묻힌 자리라도 고른다 — 서버가 낱말 조각을 줄 수도 있어 못 찾는 것보다 낫다.
// 강조할 구절이 없거나(undefined·빈 문자열) 원문에 아예 안 들어 있으면 null — 화면은 원문만 그린다.
// 명세상 구절은 원문에 반드시 들어 있지만, 서버 데이터가 어긋나도 화면이 깨지지 않게 한다
const findIndex = (content: string, matchedText: string) => {
  for (
    let at = content.indexOf(matchedText);
    at >= 0;
    at = content.indexOf(matchedText, at + 1)
  ) {
    if (standsAlone(content, at, matchedText.length)) return at;
  }
  return content.indexOf(matchedText);
};

export const splitMatchedText = (
  content: string,
  matchedText: string | undefined,
): MatchedSplit | null => {
  if (!matchedText) return null;
  const index = findIndex(content, matchedText);
  if (index < 0) return null;
  return {
    before: content.slice(0, index),
    match: matchedText,
    after: content.slice(index + matchedText.length),
  };
};
