// 편지함 조회 — 백엔드 엔드포인트가 아직 없어 픽스처를 돌려준다 (LAN-218)
//
// 제안한 계약은 아래와 같다. 열리면 각 함수의 본문만 api.get/patch로 바꾸면 된다.
//   GET   /api/v1/mailbox/letters?box=RECEIVED  → ReceivedLetter[]
//   GET   /api/v1/mailbox/letters?box=SENT      → SentLetter[]
//
// 백엔드와 맞출 것 둘.
//  - 페이지네이션: 관리자 조회(LAN-282)는 `{ items, page, size, hasNext }` Slice 형태를 쓴다.
//    편지함도 그 형태로 갈지, 편지 수가 적으니 당분간 전체 목록으로 둘지 정해야 한다
//  - `sentAt`은 오프셋이 붙은 시각(OffsetDateTime)으로 받기를 제안한다. LocalDateTime으로
//    내리면 오프셋이 없어 기기 시간대와 섞이는데, 그건 letter-date가 서울로 가정해 막고 있다
import type { ReceivedLetter, SentLetter } from './letter';
import { RECEIVED_FIXTURE, SENT_FIXTURE } from './letters.fixture';

// TODO(LAN-218 API 연결): api.get<ReceivedLetter[]>('/api/v1/mailbox/letters?box=RECEIVED')
export const getReceivedLetters = async (): Promise<ReceivedLetter[]> =>
  RECEIVED_FIXTURE;

// TODO(LAN-218 API 연결): api.get<SentLetter[]>('/api/v1/mailbox/letters?box=SENT')
export const getSentLetters = async (): Promise<SentLetter[]> => SENT_FIXTURE;
