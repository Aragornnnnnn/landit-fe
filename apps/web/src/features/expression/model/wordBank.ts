// 복습 영작 단어뱅크 로직 — 정답 문장을 단어 칩으로 나누고, 사용자가 배치한 순서가 정답인지 판정한다

export interface WordChip {
  id: number;
  word: string;
}

// 단어 양끝의 문장부호를 떼어낸다(칩은 깔끔하게, 비교는 일관되게). 내부 아포스트로피(it's)는 보존.
const strip = (word: string) =>
  word.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');

// 문장 → 단어 배열. 부호 제거 후 빈 토큰은 버린다.
export const tokenize = (sentence: string): string[] =>
  sentence.trim().split(/\s+/).map(strip).filter(Boolean);

// 문장 → (셔플된) 단어 칩. 셔플은 순수하지 않으므로 주입받는다(기본은 항등 함수라 테스트가 결정적).
export const buildWordChips = (
  sentence: string,
  shuffle: <T>(items: T[]) => T[] = (items) => items,
): WordChip[] => shuffle(tokenize(sentence).map((word, id) => ({ id, word })));

// 배치한 단어열이 정답과 일치하는가 — 대소문자·문장부호 무시
export const isArrangementCorrect = (
  placed: string[],
  answer: string,
): boolean => {
  const target = tokenize(answer);
  if (placed.length !== target.length) return false;
  return placed.every(
    (word, index) => word.toLowerCase() === target[index].toLowerCase(),
  );
};

// 입력 문장의 단어 수 — 영작 입력 화면의 "N words" 카운터용
export const countWords = (text: string): number => tokenize(text).length;

// 단어 배열 → 칩. BE가 이미 섞어준 shuffledWords를 그대로 뱅크로 쓸 때 사용 (클라 셔플 안 함).
export const chipsFromWords = (words: string[]): WordChip[] =>
  words.map((word, id) => ({ id, word }));

// 배치한 단어열이 정답 단어열과 일치하는가 — 대소문자 무시 (answerWords는 이미 칩 단위라 토큰화 불필요)
export const isWordsCorrect = (placed: string[], answer: string[]): boolean =>
  placed.length === answer.length &&
  placed.every(
    (word, index) => word.toLowerCase() === answer[index].toLowerCase(),
  );
