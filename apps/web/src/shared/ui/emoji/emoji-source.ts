// 소스에 쓰인 이모지를 찾아내고, 토스페이스가 배포하는 SVG 파일명으로 바꾸는 순수 함수들
// 에셋을 내려받는 스크립트와 누락을 감시하는 테스트가 같은 규칙을 보게 하려고 한곳에 둔다

// 기본이 그림인 문자(✅)는 그대로, 기본이 글자인 문자(↔)는 표기 선택자가 붙었을 때만 이모지로 본다 —
// 주석에 쓴 화살표까지 에셋으로 끌어오지 않으려는 구분이다
const BASE = String.raw`(?:\p{RI}\p{RI}|\p{Emoji_Presentation}\uFE0F?|\p{Extended_Pictographic}\uFE0F)`;
const MODIFIER = String.raw`(?:[\u{1F3FB}-\u{1F3FF}]|\u{20E3})?`;
const EMOJI_PATTERN = new RegExp(
  `${BASE}${MODIFIER}(?:\u200D${BASE}${MODIFIER})*`,
  'gu',
);

/** 소스 문자열에서 이모지를 등장 순서대로, 중복 없이 뽑는다 */
export const extractEmoji = (source: string): string[] => [
  ...new Set(source.match(EMOJI_PATTERN) ?? []),
];

/**
 * 토스가 코드포인트가 아닌 영어 이름으로 배포하는 글자들 (키캡 이모지 1️⃣의 재료라 폰트에 들어있다).
 * 위 규칙은 맨숫자를 이모지로 안 보므로 소스를 훑어서는 찾을 수 없다 — 영어 수준 카드가 이 글리프를 쓴다.
 * 닫힌 집합이라 통째로 에셋에 담는다. 새 숫자를 화면에 써도 빠지지 않는다
 */
export const NAMED_GLYPHS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '*': 'asterisk',
};

/** 이모지를 토스페이스 SVG 파일명으로 바꾼다 — 💬는 u1F4AC, 🇺🇸는 u1F1FA_u1F1F8, ✉️는 u2709 */
export const toSvgFileName = (emoji: string): string => {
  const named = NAMED_GLYPHS[emoji];
  if (named) return `${named}.svg`;

  return `${[...emoji]
    .map((char) => char.codePointAt(0)!)
    .filter((codePoint) => codePoint !== 0xfe0f)
    .map((codePoint) => `u${codePoint.toString(16).toUpperCase()}`)
    .join('_')}.svg`;
};
