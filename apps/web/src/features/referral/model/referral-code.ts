// 초대 코드 찾기·정리 규칙 — 카톡 메시지를 통째로 붙여넣어도 코드 8자리만 골라낸다
export const REFERRAL_CODE_LENGTH = 8;

// 백엔드 코드 글자 — 헷갈리는 I·O·0·1을 뺀 대문자·숫자 (ReferralCodeService.ALPHABET)
const CODE_CHAR = '[A-HJ-NP-Z2-9]';
// 네 자씩 끊어 하이픈이나 공백을 넣어 보내도 받는다 ("K7QM-3XPA")
const SPLIT_CODE = `${CODE_CHAR}{4}[- ]?${CODE_CHAR}{4}`;
// 공유 문구의 「초대 코드: XXXXXXXX」 줄 — 다른 낱말보다 먼저 본다
const LABELED = new RegExp(
  `초대\\s*코드\\s*[:：]?\\s*(${SPLIT_CODE})(?![A-Z0-9])`,
);
// 앞뒤가 영문·숫자로 이어지지 않는 낱말만 — 더 긴 낱말의 일부를 코드로 잘라 오지 않는다
const STANDALONE = new RegExp(`(?<![A-Z0-9])(${SPLIT_CODE})(?![A-Z0-9])`);
const URL = /https?:\/\/\S+/g;

const compact = (code: string) => code.replace(/[- ]/g, '');

/** 붙여넣은 글에서 초대 코드를 찾는다. 없으면 null */
export const findReferralCode = (text: string): string | null => {
  // 링크 속 경로(download 등)가 코드로 잡히지 않게 먼저 걷어낸다
  const upper = text.toUpperCase().replace(URL, ' ');
  const match = upper.match(LABELED) ?? upper.match(STANDALONE);
  return match ? compact(match[1]) : null;
};

/** 칸에 직접 친 글자를 코드 모양으로 정리한다 — 대문자로, 코드에 안 쓰는 글자는 버리고, 8자까지 */
export const typedReferralCode = (input: string) =>
  input
    .toUpperCase()
    .replace(new RegExp(`[^${CODE_CHAR.slice(1, -1)}]`, 'g'), '')
    .slice(0, REFERRAL_CODE_LENGTH);
