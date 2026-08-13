// 편지함 응답 타입 — 백엔드가 아직 없어 FE가 먼저 쓴 계약 초안이다 (LAN-218)
// 확정되면 이 파일은 백엔드 응답을 그대로 미러하는 자리로 돌아온다

// 받은 편지 종류. 공지·업데이트는 운영이 모두에게 보내고, 답장은 내 피드백에 온 회신이다
export type ReceivedLetterKind = 'NOTICE' | 'UPDATE' | 'REPLY';

// 보낸 편지(피드백) 유형 — 작성 화면에서 고르는 네 가지
export type FeedbackType = 'BUG' | 'FEATURE' | 'QUESTION' | 'CHEER';

// 보낸 편지 처리 상태
export type FeedbackStatus = 'PENDING' | 'ANSWERED';

export interface ReceivedLetter {
  letterId: number;
  kind: ReceivedLetterKind;
  title: string;
  // 리스트에 한 줄로 접어 보여줄 발췌. 길이는 백엔드가 정하고 넘치면 화면이 말줄임한다
  preview: string;
  sentAt: string;
  read: boolean;
}

export interface SentLetter {
  letterId: number;
  // 보낸 편지의 제목은 고른 유형이 된다 — 유저가 쓴 원문은 preview로 내려온다
  feedbackType: FeedbackType;
  status: FeedbackStatus;
  preview: string;
  sentAt: string;
}
