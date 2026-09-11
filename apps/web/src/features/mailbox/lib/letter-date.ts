// 편지 날짜 표기 — 서버가 주는 시각을 서울 기준으로 읽어 화면 문구로 바꾼다
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

// 편지 시각 조각 — 서울 기준으로 읽는 규칙은 shared/lib/seoul-date에 있다
const readSeoulDate = (sentAt: string) =>
  readSeoulDateParts(sentAt, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    // h23이라야 자정이 24시로 나오지 않는다
    hourCycle: 'h23',
  });

// 리스트용 — `26.08.09`. 좁은 한 줄에 연도까지 넣어야 해서 두 자리로 줄인다
export const formatLetterDate = (sentAt: string) => {
  const parts = readSeoulDate(sentAt);
  if (!parts) return '';

  return `${parts.year}.${parts.month}.${parts.day}`;
};

// 상세용 — `8월 9일 오전 11:30`. 편지 한 통을 펼쳐 보는 자리라 시각까지 읽어 준다
export const formatLetterDateTime = (sentAt: string) => {
  const parts = readSeoulDate(sentAt);
  if (!parts) return '';

  const hour24 = Number(parts.hour);
  const meridiem = hour24 < 12 ? '오전' : '오후';

  return `${Number(parts.month)}월 ${Number(parts.day)}일 ${meridiem} ${hour24 % 12 || 12}:${parts.minute}`;
};
