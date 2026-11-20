// 판매 판정이 보는 시계 — 환급 판매·친구 초대 종료 시각에 화면을 다시 그리게 하고, 개발자 점검에서는 종료 전·후로 고정해 볼 수 있다
import { createBoundaryClock } from './boundary-clock';
import { REFERRAL_UNTIL, REWARD_SALE_UNTIL } from './offer-schedule';

/** 개발자 점검이 고르는 시점 — selling: 모든 종료 시각 전, ended: 모든 종료 시각 뒤 */
export type OfferClockPin = 'selling' | 'ended';

const KEY = 'landit-offer-clock-pin';
// 세션 저장소를 못 쓰는 환경에서는 이번 실행 동안 메모리로 기억한다
let memory: OfferClockPin | null = null;

const boundaries = [REWARD_SALE_UNTIL, REFERRAL_UNTIL].filter(
  (until): until is number => until !== null,
);

export const readOfferClockPin = (): OfferClockPin | null => {
  if (memory) return memory;
  try {
    const stored = sessionStorage.getItem(KEY);
    return stored === 'selling' || stored === 'ended' ? stored : null;
  } catch {
    return null;
  }
};

// 고정할 때 쓰는 시각 — 어느 종료 시각보다도 앞, 어느 종료 시각보다도 뒤
const BEFORE_EVERY_BOUNDARY = 0;
const AFTER_EVERY_BOUNDARY = Number.MAX_SAFE_INTEGER;

const pinnedNow = () => {
  const pin = readOfferClockPin();
  if (pin === null) return null;
  return pin === 'selling' ? BEFORE_EVERY_BOUNDARY : AFTER_EVERY_BOUNDARY;
};

export const offerClock = createBoundaryClock(boundaries, pinnedNow);

/** 세션 저장소에만 둔다 — 앱을 다시 열면 실제 시각으로 돌아간다 */
export const pinOfferClock = (pin: OfferClockPin | null) => {
  memory = pin;
  try {
    if (pin) sessionStorage.setItem(KEY, pin);
    else sessionStorage.removeItem(KEY);
  } catch {
    // 메모리 값으로 이어 간다
  }
  offerClock.refresh();
};
