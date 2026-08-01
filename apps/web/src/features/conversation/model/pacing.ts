// 대화 페이싱 상수 — 음성 없을 때의 AI 발화 시간, 속마음 노출·폴링 간격
import type { ThoughtType } from './thought';

// AI 발화 시간 — 음성(ttsVoice)이 없을 때만 쓰는 폴백으로, 글자 수로 말하는 시간을 흉내 낸다
export const speechTypingMs = (text: string) =>
  Math.max(1400, text.length * 45);

// 폴백 발화가 끝난 뒤 잠깐의 숨 고르기 — 글이 끝나자마자 마이크로 넘어가면 급해 보인다
export const speechEndPauseMs = 600;

// USER 선발화 진입 안내(랜디)가 떠 있는 시간
export const userIntroHoldMs = 2800;

// 속마음 노출 유지 시간 — 긴 문장은 읽을 시간을 더 준다 (연동 후에도 유지되는 연출 페이싱)
export const thoughtHoldMs = (text: string) =>
  Math.min(2600 + text.length * 40, 5200);

// 속마음 노출이 끝난 뒤 캐릭터 표정이 남아 있는 여운. 곧바로 AI 발화가 시작되므로
// 이 값이 곧 "표정이 발화 앞부분을 덮는 길이"가 된다
export const expressionHoldMs = 1000;

// 속마음은 비동기 생성이라, 준비될 때까지 이 간격으로 폴링한다
export const innerThoughtPollMs = 500;
// 폴링 상한 — 넘으면 제출 응답 값으로라도 진행해 대화가 멈추지 않게 한다 (약 20초)
export const innerThoughtMaxPolls = 40;

// 백엔드 innerThoughtType이 미열거 문자열이라 안전하게 좁힌다
export const toThoughtType = (value: string | null): ThoughtType =>
  value === 'GOOD' || value === 'NORMAL' || value === 'BAD' ? value : 'NORMAL';
