// 언어별 문구 파일을 합치는 규칙 — 번역이 아직 없는 문구는 한국어로 채운다
type Messages = { [key: string]: string | Messages };

const isGroup = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null;

/**
 * 기본 문구 위에 다른 언어 문구를 덮는다. 덮는 쪽에 없는 키는 기본 쪽이 남아, 옮기는 중에도 빈 문구가 안 생긴다.
 */
export const mergeMessages = (base: Messages, override: Messages): Messages =>
  Object.fromEntries(
    Object.entries(base).map(([key, value]) => {
      const next = override[key];
      if (isGroup(value) && isGroup(next)) {
        return [key, mergeMessages(value, next)];
      }
      return [key, next ?? value];
    }),
  );
