// 토스트 문구를 문장 단위로 나눈다 — 문장마다 한 덩어리로 그려 줄바꿈이 문장 사이에서만 일어나게 한다

// 일본어 전각 부호는 띄어쓰기 없이 바로 다음 문장이 오고, 반각 부호는 띄어쓰기가 있어야 문장 끝이다(1.5배의 점 제외)
const SENTENCE_BOUNDARY = /(?<=[。？！])(?=\S)|(?<=[.?!]\s+)(?=\S)/;

export const splitSentences = (message: string) =>
  message.split(SENTENCE_BOUNDARY);
