// 큰 성취 순간에 쓰는 리듬 진동 — 진동 여러 개를 애니메이션 박자에 맞춰 잇는다. 박자를 바꿀 땐 이 표만 고친다
import type { HapticPattern } from '@landit/bridge';

export interface HapticBeat {
  /** 리듬 시작부터 몇 ms 뒤에 울리나 */
  at: number;
  pattern: HapticPattern;
}

// 리듬마다 붙는 연출의 박자에 맞춘다. 화면에서 가장 큰 순간이라 분명하게 느껴지도록 세게 쓴다. Android는 짧은 진동이 뭉개져 박자 간격을 90ms 이상 둔다
export const HAPTIC_RHYTHMS = {
  // 차오름 — 가볍게에서 세게로 쌓아 올리다 성공으로 터진다. 성공이 스트릭 칸이 차는 순간에 오도록 맞춘다
  rise: [
    { at: 0, pattern: 'light' },
    { at: 90, pattern: 'medium' },
    { at: 180, pattern: 'medium' },
    { at: 270, pattern: 'heavy' },
    { at: 360, pattern: 'heavy' },
    { at: 480, pattern: 'success' },
  ],
  // 동전 — 동전이 날아가는 동안 또각또각, 알약에 닿는 순간 세게 한 번과 성공
  coins: [
    { at: 0, pattern: 'medium' },
    { at: 90, pattern: 'medium' },
    { at: 180, pattern: 'medium' },
    { at: 270, pattern: 'medium' },
    { at: 360, pattern: 'heavy' },
    { at: 470, pattern: 'success' },
  ],
  // 팡 — 쾅쾅 두 번 터지고 성공이 따라온다 (복습 만점·발음 통과 폭죽)
  burst: [
    { at: 0, pattern: 'heavy' },
    { at: 100, pattern: 'heavy' },
    { at: 230, pattern: 'success' },
  ],
  // 숫자 올라가기 — 금액이 오르는 동안 톡톡톡, 다 오르는 순간 쿵 (동전 연출의 금액은 0.9초 동안 오른다)
  countUp: [
    { at: 0, pattern: 'light' },
    { at: 110, pattern: 'light' },
    { at: 220, pattern: 'light' },
    { at: 330, pattern: 'light' },
    { at: 440, pattern: 'light' },
    { at: 550, pattern: 'medium' },
    { at: 700, pattern: 'heavy' },
  ],
} as const satisfies Record<string, readonly HapticBeat[]>;

export type HapticRhythm = keyof typeof HAPTIC_RHYTHMS;

/** 리듬 이름 목록 — 고르는 화면이 순서대로 그린다 */
export const HAPTIC_RHYTHM_NAMES = Object.keys(
  HAPTIC_RHYTHMS,
) as readonly HapticRhythm[];

/** 첫 박자부터 마지막 박자까지(ms) — endAt으로 마지막 박자를 맞출 때 시작 시각을 거꾸로 잰다 */
export const rhythmDurationOf = (name: HapticRhythm) =>
  HAPTIC_RHYTHMS[name][HAPTIC_RHYTHMS[name].length - 1].at;
