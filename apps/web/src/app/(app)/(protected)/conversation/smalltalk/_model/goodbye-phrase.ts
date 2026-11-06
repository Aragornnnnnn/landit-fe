// 종료 시트가 "직접 끝내볼래요"로 보여 주는 작별 인사 예시 — 바로 따라 말할 수 있는 쉬운 말만 두고, 열 때마다 하나를 고른다

export const GOODBYE_PHRASES = [
  'Bye!',
  'See you!',
  'See you next time!',
  'Talk to you later!',
  'I have to go now. Bye!',
  'It was nice talking to you!',
  'Have a good day!',
  'Gotta go. See you!',
] as const;

export const pickGoodbyePhrase = (random: () => number = Math.random) =>
  GOODBYE_PHRASES[Math.floor(random() * GOODBYE_PHRASES.length)];
