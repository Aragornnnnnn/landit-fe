// 발화를 합성 단위로 나누는 규칙 — 합성은 길이에 비례해 느려서, 앞 조각부터 틀면 소리가 빨리 시작된다

// 이보다 짧은 조각은 옆과 붙인다 — 재생이 금방 끝나 다음 조각을 기다리며 끊기기 쉽고, 약어(Mr.)에서 잘린 조각도 여기서 다시 붙는다
const MIN_CHUNK_LENGTH = 30;

// 문장 부호(+닫는 따옴표) 뒤 공백, 그 뒤에 새 문장의 첫 글자 — 소수점(3.5)과 소문자가 이어지는 약어(a.m. on)는 걸리지 않는다.
// 뒤돌아보기 정규식은 쓰지 않는다 — iOS 16.3 이하는 문법 오류로 스크립트 전체가 죽는다
const SENTENCE_END = /([.!?]["'”’)]?)\s+(?=["'“‘(]?[A-Z0-9])/g;

// 대문자가 이어져도 문장 끝이 아닌 약어(Mr. Kim, U.S. Embassy) — 여기서 끊으면 문장 중간에 내림 억양과 쉼이 들어간다
const ABBREVIATION_END =
  /(?:^|[\s(])(?:Mr|Mrs|Ms|Dr|Prof|St|Mt|Jr|Sr|No|Inc|Ltd|vs|etc|(?:[A-Za-z]\.)+[A-Za-z])\.$/;

/** 발화를 앞에서부터 차례로 합성할 조각들로 나눈다. 이으면 원문과 같다 */
export const splitSpeechChunks = (text: string): string[] => {
  const chunks: string[] = [];
  let pending = '';
  for (const sentence of text
    .trim()
    .replace(SENTENCE_END, '$1\n')
    .split('\n')) {
    pending = pending ? `${pending} ${sentence}` : sentence;
    if (pending.length < MIN_CHUNK_LENGTH || ABBREVIATION_END.test(pending))
      continue;
    chunks.push(pending);
    pending = '';
  }
  if (!pending) return chunks;
  if (chunks.length === 0) return [pending];
  chunks[chunks.length - 1] += ` ${pending}`;
  return chunks;
};
