// 친구 초대 안내 편지 판별 — 블록 타입을 새로 만들지 않고 편지 id를 env로 둔다(설문 편지와 같은 방식).
// dev·실서버의 id가 달라 코드가 아니라 env에 두고, 편지를 여러 통 보내면 쉼표로 이어 적는다
export const isReferralLetter = (
  letterId: number,
  configured = process.env.NEXT_PUBLIC_REFERRAL_LETTER_ID,
) =>
  !!configured &&
  configured
    .split(',')
    .map((id) => Number(id.trim()))
    .includes(letterId);
