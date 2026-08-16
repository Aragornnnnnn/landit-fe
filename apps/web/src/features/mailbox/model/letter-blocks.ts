// 공지·업데이트 본문의 블록 — 서버는 관리자가 넣은 JSON을 그대로 내려주고(JsonNode) 모양을 지켜 주지 않는다.
// 그래서 아는 모양만 골라내고 나머지는 버린다. 모르는 블록 하나 때문에 편지 전체가 깨지면 안 된다
export type LetterBlock =
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'IMAGE'; url: string; caption?: string | null }
  | { type: 'ORDERED_LIST'; items: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isLetterBlock = (value: unknown): value is LetterBlock => {
  if (!isRecord(value)) return false;

  switch (value.type) {
    case 'PARAGRAPH':
      return typeof value.text === 'string';
    case 'IMAGE':
      return (
        typeof value.url === 'string' &&
        // JSON엔 undefined가 없어 "캡션 없음"은 null로 온다
        (value.caption == null || typeof value.caption === 'string')
      );
    case 'ORDERED_LIST':
      return isStringArray(value.items);
    default:
      return false;
  }
};

export const readLetterBlocks = (raw: unknown): LetterBlock[] =>
  Array.isArray(raw) ? raw.filter(isLetterBlock) : [];
