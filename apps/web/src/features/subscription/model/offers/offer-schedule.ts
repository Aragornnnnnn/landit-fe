// 판매 종료 시각 — 환급 판매와 친구 초대를 끝내는 시각 (docs/subscription.md 「판매 스위치」).
// 시각은 코드에 적어 둔다 — 배포 설정을 건드리지 않아도 그 시각에 끝난다. 다시 팔 때만 배포 설정에 미래 시각을 넣어 덮어쓴다

/** ISO 8601 시각(`2026-11-21T00:00:00+09:00`)을 epoch ms로. 비었거나 읽을 수 없으면 null */
export const parseUntil = (value: string | undefined): number | null => {
  const time = Date.parse(value ?? '');
  return Number.isNaN(time) ? null : time;
};

/**
 * 종료 시각을 정한다 — 배포 설정에 읽을 수 있는 시각이 있으면 그 값, 없으면 코드에 적은 시각.
 * 설정을 잘못 적어도(오타·빈 값) 코드의 시각으로 돌아가, 판매가 뜻밖에 되살아나거나 일찍 끝나지 않는다
 */
export const resolveUntil = (override: string | undefined, written: string) =>
  parseUntil(override) ?? parseUntil(written);

// 환급 이용권과 친구 초대는 2026-11-20까지 팔고, 21일 00:00(KST)에 끝낸다 (LAN-867)
const REWARD_SALE_ENDS_AT = '2026-11-21T00:00:00+09:00';
const REFERRAL_ENDS_AT = '2026-11-21T00:00:00+09:00';

// 잠금 스위치 — 종료 시각은 기기 시계로 판단해서, 기기 날짜를 되돌린 사람에게는 판매가 다시 보일 수 있다.
// 종료한 뒤 true로 두면 시각과 상관없이 닫힌다. 다시 팔 때는 지우고 종료 시각을 미래로 넣는다
export const REWARD_SALE_LOCKED =
  process.env.NEXT_PUBLIC_REWARD_SALE_LOCKED === 'true';

export const REFERRAL_LOCKED =
  process.env.NEXT_PUBLIC_REFERRAL_LOCKED === 'true';

// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하다
export const REWARD_SALE_UNTIL = resolveUntil(
  process.env.NEXT_PUBLIC_REWARD_SALE_UNTIL,
  REWARD_SALE_ENDS_AT,
);

export const REFERRAL_UNTIL = resolveUntil(
  process.env.NEXT_PUBLIC_REFERRAL_UNTIL,
  REFERRAL_ENDS_AT,
);
