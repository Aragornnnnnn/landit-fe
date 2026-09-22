// 단어 선택 퀴즈의 단어뱅크 — BE가 섞어준 단어들을 칩으로 만들고, 배치한 순서가 정답인지 판정한다 (QUIZ·REVIEW 공용)

export interface WordChip {
  id: number;
  word: string;
}

// 단어 배열 → 칩. BE가 이미 섞어준 shuffledWords를 그대로 뱅크로 쓸 때 사용 (클라 셔플 안 함).
export const chipsFromWords = (words: string[]): WordChip[] =>
  words.map((word, id) => ({ id, word }));

// 배치한 단어열이 정답 단어열과 일치하는가 — 대소문자 무시 (answerWords는 이미 칩 단위라 토큰화 불필요)
export const isWordsCorrect = (placed: string[], answer: string[]): boolean =>
  placed.length === answer.length &&
  placed.every(
    (word, index) => word.toLowerCase() === answer[index].toLowerCase(),
  );

// 한국어 작문은 어순이 달라도 같은 뜻이면 서버가 정답으로 본다 — 화면도 허용 정답 전체를 기준으로 판단한다.
// 영어는 정답이 하나라 배열에 하나만 들어오고, 아래 셋 다 기존 동작 그대로가 된다
export const matchesAnyAnswer = (
  placed: string[],
  answers: string[][],
): boolean => answers.some((answer) => isWordsCorrect(placed, answer));

// 앞에서부터 몇 단어가 맞는가 — 힌트가 "지금 만들고 있는 정답"을 고르는 기준
const matchedPrefix = (placed: string[], answer: string[]) => {
  const length = placed.findIndex(
    (word, index) => word.toLowerCase() !== answer[index]?.toLowerCase(),
  );
  return length === -1 ? placed.length : length;
};

/**
 * 지금 배치와 앞에서부터 가장 많이 맞는 정답을 고른다.
 * 여러 정답 중 사용자가 만들고 있는 쪽을 힌트 기준으로 삼아, 다른 정답의 단어를 틀렸다고 표시하지 않게 한다.
 * 맞는 자리 수가 같으면 앞선 정답을 유지한다 — 한 글자 올릴 때마다 기준이 흔들리면 힌트가 튄다.
 */
export const bestMatchingAnswer = (
  placed: string[],
  answers: string[][],
): string[] =>
  answers.reduce((best, answer) =>
    matchedPrefix(placed, answer) > matchedPrefix(placed, best) ? answer : best,
  );

// 정답마다 길이가 다를 수 있다 — 가장 긴 정답까지는 단어를 올릴 수 있어야 한다
export const maxAnswerLength = (answers: string[][]): number =>
  Math.max(...answers.map((answer) => answer.length));
