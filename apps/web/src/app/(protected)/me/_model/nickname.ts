// 닉네임 입력 검증 — 백엔드 NicknameValidator(LAN-635)와 같은 규칙. 저장 전에 걸러 400을 미리 막는다

export const NICKNAME_MAX_LENGTH = 20;

// 유니코드상 글자(Lo)지만 아무것도 안 그려져 빈 이름을 만드는 한글 채움 문자 — 백엔드도 따로 막는다
const HANGUL_FILLERS = /[\u115F\u1160\u3164\uFFA0]/u;
const ALLOWED = /^[\p{L}\p{Nd} ]+$/u;

export type NicknameValidation =
  | { ok: true; value: string }
  | { ok: false; reason: 'empty' | 'too_long' | 'invalid_char' };

/** 앞뒤 공백을 뗀 글자 수. 코드 포인트 기준 — 이모지를 막으므로 눈에 보이는 글자 수와 같다 */
export const countNicknameLength = (input: string) => [...input.trim()].length;

export const validateNickname = (input: string): NicknameValidation => {
  const value = input.trim();
  const length = countNicknameLength(value);
  if (length === 0) return { ok: false, reason: 'empty' };
  if (length > NICKNAME_MAX_LENGTH) return { ok: false, reason: 'too_long' };
  if (!ALLOWED.test(value) || HANGUL_FILLERS.test(value)) {
    return { ok: false, reason: 'invalid_char' };
  }
  return { ok: true, value };
};
