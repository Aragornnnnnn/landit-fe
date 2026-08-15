// 편지함 임시 데이터 — 아직 서버를 부르지 않는다. 실제 호출이 붙으면 이 파일과 letters.ts의 반환부를 함께 지운다 (LAN-218)
// 모양은 백엔드 계약 그대로다. 문구는 피그마 840-495의 목업을 옮긴 것이라 제품 문구가 아니다
import type { MailboxPage, ReceivedLetter, SentFeedback } from './letter';

export const RECEIVED_FIXTURE: MailboxPage<ReceivedLetter> = {
  items: [
    {
      letterId: 1,
      letterType: 'NOTICE',
      title: '우리가 앱을 만든 이유',
      preview: '누구나 외국어 앞에서 작아지는 순간이 있어요...',
      pinned: true,
      sentAt: '2026-08-01T10:00:00',
      unread: false,
    },
    {
      letterId: 2,
      letterType: 'UPDATE',
      title: '이번 업데이트 소식',
      preview: '고객의 소리함 편지함으로 개편 외 2건',
      pinned: false,
      sentAt: '2026-08-09T11:30:00',
      unread: false,
    },
    {
      letterId: 3,
      letterType: 'REPLY',
      title: '보내주신 의견에 대한 답장',
      preview:
        '불편을 드려 죄송해요! 로그인 세션 유지 시간을 늘리는 패치를 준비 중이에요.',
      pinned: false,
      sentAt: '2026-08-09T15:47:00',
      unread: true,
    },
  ],
  nextCursor: null,
  hasNext: false,
};

export const SENT_FIXTURE: MailboxPage<SentFeedback> = {
  items: [
    {
      feedbackId: 11,
      type: 'FEATURE_REQUEST',
      title: '기능 제안',
      preview: '다크모드 지원해주세요. 밤에 쓸 때 눈이 너무 부셔요.',
      status: 'PENDING',
      createdAt: '2026-08-08T18:20:00',
    },
    {
      feedbackId: 12,
      type: 'BUG_REPORT',
      title: '버그 제보',
      preview:
        '로그인이 자꾸 풀려요. 하루에 서너 번은 다시 로그인해야 해서 너무 불편해요.',
      status: 'COMPLETED',
      createdAt: '2026-08-03T09:14:00',
    },
  ],
  nextCursor: null,
  hasNext: false,
};
