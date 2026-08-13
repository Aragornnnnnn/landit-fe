// 편지함 임시 데이터 — 백엔드 엔드포인트가 생기면 이 파일과 letters.ts의 분기를 함께 지운다 (LAN-218)
// 피그마 840-495의 목업 문구를 그대로 옮겼다. 화면 검증용이지 제품 문구가 아니다
import type { ReceivedLetter, SentLetter } from './letter';

export const RECEIVED_FIXTURE: ReceivedLetter[] = [
  {
    letterId: 1,
    kind: 'NOTICE',
    title: '우리가 앱을 만든 이유',
    preview: '누구나 외국어 앞에서 작아지는 순간이 있어요...',
    sentAt: '2026-08-01T01:00:00Z',
    read: true,
  },
  {
    letterId: 2,
    kind: 'UPDATE',
    title: '이번 업데이트 소식',
    preview: '고객의 소리함 편지함으로 개편 외 2건',
    sentAt: '2026-08-09T02:30:00Z',
    read: true,
  },
  {
    letterId: 3,
    kind: 'REPLY',
    title: '보내주신 의견에 대한 답장',
    preview:
      '불편을 드려 죄송해요! 로그인 세션 유지 시간을 늘리는 패치를 준비 중이에요.',
    sentAt: '2026-08-09T06:47:00Z',
    read: false,
  },
];

export const SENT_FIXTURE: SentLetter[] = [
  {
    letterId: 11,
    feedbackType: 'FEATURE',
    status: 'PENDING',
    preview: '다크모드 지원해주세요. 밤에 쓸 때 눈이 너무 부셔요.',
    sentAt: '2026-08-08T09:20:00Z',
  },
  {
    letterId: 12,
    feedbackType: 'BUG',
    status: 'ANSWERED',
    preview:
      '로그인이 자꾸 풀려요. 하루에 서너 번은 다시 로그인해야 해서 너무 불편해요.',
    sentAt: '2026-08-03T00:14:00Z',
  },
];
