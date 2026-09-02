// LAN-428 설문 안내 편지 판별(임시) — 블록 타입을 새로 만들지 않고 편지 id 하나를 env로 박아 둔다.
// dev·실서버의 id가 달라 코드가 아니라 env에 둔다. 설문이 끝나면 env와 함께 지운다
export const isSurveyLetter = (
  letterId: number,
  configured = process.env.NEXT_PUBLIC_SURVEY_LETTER_ID,
) => !!configured && Number(configured) === letterId;
