// 서버가 받는 답변 모양 검사 — Answer 계약(문자열·숫자·문자열 배열)과 크기 상한.
// 한 번 넣으면 기본키 때문에 다시 못 넣으니, 이상한 모양은 저장 전에 돌려보낸다
import type { Answer } from './answers';

// 문항 12개 + 기타 입력 몇 개면 충분하다. 넘치면 우리 화면이 보낸 게 아니다
const MAX_ANSWERS = 40;
const MAX_TEXT_LENGTH = 1000;
// 복수 선택은 선택지가 다섯 남짓 — 그 몇 배면 충분하다
const MAX_CHOICES = 20;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;

const isAnswer = (value: unknown): value is Answer =>
  isText(value) ||
  (typeof value === 'number' && Number.isFinite(value)) ||
  (Array.isArray(value) && value.length <= MAX_CHOICES && value.every(isText));

export const isAnswers = (value: unknown): value is Record<string, Answer> =>
  isRecord(value) &&
  Object.keys(value).length <= MAX_ANSWERS &&
  Object.values(value).every(isAnswer);
