// 닉네임 입력 검증 — 허용 글자는 백엔드 NicknameValidator(LAN-635)와 같고 길이만 더 좁다. 저장 전에 걸러 400을 미리 막는다

// 백엔드는 20자까지 받지만 앱은 10자로 더 좁게 막는다 — "OO님의 레벨은" 같은 문장과 가장 좁은 폰(375)의
// 마이페이지 헤더에서 이름이 한 줄에 들어가는 한계가 한글 10자다
export const NICKNAME_MAX_LENGTH = 10;

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

export type NicknameDisplaySize = 'lg' | 'md' | 'sm';

// 한글·한자처럼 폭이 넓은 글자는 1칸, 영문·숫자·띄어쓰기는 대략 0.6칸
const WIDE_CHAR =
  /[\u1100-\u11FF\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFF00-\uFFEF]/u;
const widthUnitsOf = (name: string) =>
  [...name].reduce((sum, char) => sum + (WIDE_CHAR.test(char) ? 1 : 0.6), 0);

// 가장 좁은 폰(375) 헤더 이름 칸에 한 줄로 들어가는 칸 수 — 큰 글자 8.5칸, 한 단계 줄이면 11칸
const LG_UNITS = 8.5;
const MD_UNITS = 11;

/** 마이페이지 헤더에서 이름을 보여줄 글자 크기. 줄바꿈을 줄이려고 길수록 작게 쓴다 */
export const nicknameDisplaySize = (name: string): NicknameDisplaySize => {
  const units = widthUnitsOf(name.trim());
  if (units <= LG_UNITS) return 'lg';
  if (units <= MD_UNITS) return 'md';
  return 'sm';
};
