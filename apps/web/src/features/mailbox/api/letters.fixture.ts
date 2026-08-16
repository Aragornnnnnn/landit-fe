// 편지함 임시 데이터 — 아직 서버를 부르지 않는다. 실제 호출이 붙으면 이 파일과 letters.ts의 반환부를 함께 지운다 (LAN-218)
// 모양은 백엔드 계약 그대로다. 문구는 피그마 840-495의 목업을 옮긴 것이라 제품 문구가 아니다
import type {
  FeedbackType,
  MailboxPage,
  ReceivedLetter,
  SentFeedback,
} from './letter';
import type { ReceivedLetterDetail, SentFeedbackDetail } from './letter-detail';

// 서버가 유형마다 붙여 주는 표시 제목. 화면은 우리 문구를 쓰므로 모양을 맞추려고만 둔다
export const SENT_TITLES: Record<FeedbackType, string> = {
  BUG_REPORT: '버그 제보',
  FEATURE_REQUEST: '기능 제안',
  QUESTION: '문의',
  CHEER: '응원',
};

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

// 받은 편지 한 통 — 목록의 letterId를 그대로 키로 쓴다
export const RECEIVED_DETAIL_FIXTURE: Record<number, ReceivedLetterDetail> = {
  1: {
    letterId: 1,
    letterType: 'NOTICE',
    title: '우리가 앱을 만든 이유',
    contentBlocks: [
      { type: 'IMAGE', url: '', caption: '시작하는 마음' },
      {
        type: 'PARAGRAPH',
        text: '누구나 외국어 앞에서 작아지는 순간이 있어요. 랜딧은 그 순간을 함께 연습할 수 있는 자리를 만들고 싶어서 시작했습니다.',
      },
      {
        type: 'PARAGRAPH',
        text: '실제로 겪을 법한 상황을 시나리오로 만들고, 편하게 여러 번 말해보면서 자신감을 쌓을 수 있도록 돕고 있어요.',
      },
    ],
    bodyText: null,
    pinned: true,
    sentAt: '2026-08-01T10:00:00',
    readAt: '2026-08-01T10:30:00',
  },
  2: {
    letterId: 2,
    letterType: 'UPDATE',
    title: '이번 업데이트 소식',
    contentBlocks: [
      { type: 'IMAGE', url: '', caption: '이번 업데이트 하이라이트' },
      {
        type: 'ORDERED_LIST',
        items: [
          '고객의 소리함 편지함으로 개편 — 공지·답장을 한 곳에서 확인하고, 피드백도 더 쉽게 보낼 수 있어요.',
          '복습 영작 단어뱅크 추가 — 표현이 잘 기억나지 않을 때 단어 칩으로 힌트를 받을 수 있어요.',
          '자잘한 버그 수정 — 홈 화면 스크롤과 진행도 표시가 더 매끄러워졌어요.',
        ],
      },
    ],
    bodyText: null,
    pinned: false,
    sentAt: '2026-08-09T11:30:00',
    readAt: '2026-08-09T12:00:00',
  },
  3: {
    letterId: 3,
    letterType: 'REPLY',
    title: '보내주신 의견에 대한 답장',
    contentBlocks: null,
    bodyText:
      '불편을 드려 죄송해요! 로그인 세션 유지 시간을 늘리는 패치를 준비 중이에요. 다음 업데이트에 반영될 예정입니다.',
    pinned: false,
    sentAt: '2026-08-09T15:47:00',
    readAt: null,
    // 아직 계약에 없어 요청해 둔 값 — 오면 제목과 인용 상자가 채워진다
    feedbackType: 'BUG_REPORT',
    quotedFeedbackContent:
      '로그인이 자꾸 풀려요. 하루에 서너 번은 다시 로그인해야 해서 너무 불편해요.',
  },
};

// 내가 보낸 피드백 한 통 — 목록의 feedbackId를 그대로 키로 쓴다
export const SENT_DETAIL_FIXTURE: Record<number, SentFeedbackDetail> = {
  11: {
    feedbackId: 11,
    type: 'FEATURE_REQUEST',
    title: '기능 제안',
    content: '다크모드 지원해주세요. 밤에 쓸 때 눈이 너무 부셔요.',
    status: 'PENDING',
    resolvedByFeedbackId: null,
    createdAt: '2026-08-08T18:20:00',
    updatedAt: '2026-08-08T18:20:00',
    replies: [],
  },
  12: {
    feedbackId: 12,
    type: 'BUG_REPORT',
    title: '버그 제보',
    content:
      '로그인이 자꾸 풀려요. 하루에 서너 번은 다시 로그인해야 해서 너무 불편해요.',
    status: 'COMPLETED',
    resolvedByFeedbackId: null,
    createdAt: '2026-08-03T09:14:00',
    updatedAt: '2026-08-09T15:47:00',
    replies: [
      {
        letterId: 3,
        title: '보내주신 의견에 대한 답장',
        bodyText:
          '불편을 드려 죄송해요! 로그인 세션 유지 시간을 늘리는 패치를 준비 중이에요. 다음 업데이트에 반영될 예정입니다.',
        sentAt: '2026-08-09T15:47:00',
      },
    ],
  },
};
