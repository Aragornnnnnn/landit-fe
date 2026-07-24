// 복습 영작 단어뱅크 로직 — BE가 섞어준 단어들을 칩으로 만들고, 배치한 순서가 정답인지 판정한다

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
