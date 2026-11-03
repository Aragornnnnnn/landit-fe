// LAN-428 설문 안내 편지 판별(임시) — 블록 타입을 새로 만들지 않고 편지 id를 env로 박아 둔다.
// dev·실서버의 id가 달라 코드가 아니라 env에 두고, 편지를 여러 통 보내면 쉼표로 이어 적는다. 설문이 끝나면 env와 함께 지운다
import type { SurveyKind } from '@landit/analytics';

const includesLetter = (configured: string | undefined, letterId: number) =>
  !!configured &&
  configured
    .split(',')
    .map((id) => Number(id.trim()))
    .includes(letterId);

// 이 편지가 여는 설문 — 설문 편지가 아니면 null
export const surveyOfLetter = (
  letterId: number,
  configured: Record<SurveyKind, string | undefined> = {
    general: process.env.NEXT_PUBLIC_SURVEY_LETTER_ID,
    paid: process.env.NEXT_PUBLIC_PAID_SURVEY_LETTER_ID,
  },
): SurveyKind | null =>
  // 설문 종류를 하나씩 이름 대지 않는다 — 종류가 늘면 env 자리(위 Record)만 채우면 판별도 따라온다
  (Object.keys(configured) as SurveyKind[]).find((kind) =>
    includesLetter(configured[kind], letterId),
  ) ?? null;
