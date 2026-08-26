// 소스에 쓰인 이모지를 찾아내고, 토스페이스가 배포하는 SVG 파일명으로 바꾸는 순수 함수들
// 에셋을 내려받는 스크립트와 누락을 감시하는 테스트가 같은 규칙을 보게 하려고 한곳에 둔다

// 이모지 한 덩어리를 집는 규칙.
// 기본이 그림인 문자(✅)는 그대로, 기본이 글자인 문자(↔)는 표기 선택자 U+FE0F가 붙었을 때만 이모지로 본다 —
// 주석에 화살표를 쓴 것까지 이모지로 끌어오지 않으려는 구분이다.
// 국기는 지역 표시자 둘, 그 밖에 피부색·키캡·ZWJ 결합이 뒤에 붙는다
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

// 토스는 숫자와 별표만 코드포인트가 아닌 영어 이름으로 배포한다 (키캡 이모지 1️⃣의 재료라 폰트에 들어있다)
const NAMED_GLYPHS: Record<string, string> = {
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

/**
 * 이모지를 토스페이스 SVG 파일명으로 바꾼다.
 * 토스는 코드포인트를 `u{대문자 16진수}`로 적고 합쳐지는 이모지는 `_`로 잇는다 — 💬는 u1F4AC, 🇺🇸는 u1F1FA_u1F1F8.
 * 표기 선택자(U+FE0F)는 파일명에 넣지 않는다.
 */
export const toSvgFileName = (emoji: string): string => {
  const named = NAMED_GLYPHS[emoji];
  if (named) return `${named}.svg`;

  return `${[...emoji]
    .map((char) => char.codePointAt(0)!)
    .filter((codePoint) => codePoint !== 0xfe0f)
    .map((codePoint) => `u${codePoint.toString(16).toUpperCase()}`)
    .join('_')}.svg`;
};
