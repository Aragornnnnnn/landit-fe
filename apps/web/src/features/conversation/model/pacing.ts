// 대화 페이싱 상수 — AI 발화 지속 시간(LAN-140 TTS onEnd로 교체)과 속마음 노출 시간
import type { ThoughtType } from '@/features/onboarding/ui/ThoughtCard';

// AI 발화 시간 — TTS 연동 전까지 글자 수 기반으로 말하는 시간을 흉내 낸다
export const speechTypingMs = (text: string) =>
  Math.max(1400, text.length * 45);

// 속마음 노출 유지 시간 — 긴 문장은 읽을 시간을 더 준다 (연동 후에도 유지되는 연출 페이싱)
export const thoughtHoldMs = (text: string) =>
  Math.min(2600 + text.length * 40, 5200);

// 백엔드 innerThoughtType이 미열거 문자열이라 안전하게 좁힌다
export const toThoughtType = (value: string | null): ThoughtType =>
  value === 'GOOD' || value === 'NORMAL' || value === 'BAD' ? value : 'NORMAL';
