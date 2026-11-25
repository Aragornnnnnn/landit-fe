// 대화 페이싱 상수 — 음성 없을 때의 AI 발화 시간, 속마음 기다림·표정·폴링 간격
import type { ThoughtType } from './thought';

// AI 발화 시간 — 음성(ttsVoice)이 없을 때의 폴백과 글자 타이핑 연출이 쓴다. 글자 수로 말하는 시간을 흉내 낸다.
// 실제 오디오와 달리 스스로 배속을 따라가지 못하는 상수 타이머라, 말하기 속도를 직접 나눠준다
export const speechTypingMs = (text: string, rate: number = 1) =>
  Math.max(1400, text.length * 45) / rate;

// 폴백 발화가 끝난 뒤 잠깐의 숨 고르기 — 글이 끝나자마자 마이크로 넘어가면 급해 보인다
export const speechEndPauseMs = 600;

// 속마음을 기다려 주는 상한 — 내 말을 보낸 순간부터 센다. 안에 오면 속마음과 대사가 한 말풍선으로 함께 나오고,
// 넘으면 대사부터 말하며 속마음 자리는 뼈대로 잡아 둔다. 사용자가 느끼는 기다림 기준이라 대답이 늦어도 더 끌지 않는다
export const thoughtWaitMs = 3000;

/** 대답이 온 지금, 속마음을 얼마나 더 기다릴지 — 보낸 뒤 이미 지난 시간만큼 뺀다 */
export const thoughtWaitLeftMs = (sentAt: number, now: number) =>
  Math.max(0, thoughtWaitMs - (now - sentAt));

// 속마음이 말풍선에 뜬 뒤 그 감정이 캐릭터 표정으로 남아 있는 시간. 립싱크와 따로 움직여 말하는 동안 얹혀도 된다
export const expressionHoldMs = 3000;

// 속마음은 비동기 생성이라, 준비될 때까지 이 간격으로 폴링한다
export const innerThoughtPollMs = 500;
// 폴링 상한 — 넘으면 제출 응답 값으로라도 진행해 대화가 멈추지 않게 한다 (약 20초)
export const innerThoughtMaxPolls = 40;

// 백엔드 innerThoughtType이 미열거 문자열이라 안전하게 좁힌다
export const toThoughtType = (value: string | null): ThoughtType =>
  value === 'GOOD' || value === 'NORMAL' || value === 'BAD' ? value : 'NORMAL';
