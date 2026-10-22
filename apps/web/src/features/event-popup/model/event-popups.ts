// 홈에 띄울 이벤트 공지 목록 — 백엔드 API가 생기기 전까지 이미지는 코드에, 켜고 끄기는 환경변수로 한다.
// 모양은 나중에 받을 API 응답과 맞춰 두어, API로 바꿀 때 이 목록을 응답으로 갈아 끼우기만 하면 된다

// 가로 import 사유: 공지는 편지함의 공지 편지로 이어진다 — 편지 주소는 편지함이 만든다
import { receivedLetterPath } from '@/features/mailbox/model/box';

export interface EventPopup {
  /** 반응한 기록의 열쇠 — 같은 공지를 다시 띄우려면 새 id로 등록한다 */
  popupId: string;
  /** 가로 4:3 한 장(1200×900 권장). 문구까지 넣되 위쪽 두 모서리는 둥글게 잘리니 글자를 붙이지 않는다 */
  imageUrl: string;
  /** 스크린 리더가 읽을 이미지 설명 — 이미지에 쓴 문구를 그대로 적는다 */
  imageAlt: string;
  /** 「자세히 보기」로 갈 앱 안 경로 (예: /mailbox/received/12) */
  linkUrl: string;
  /** 노출 시작 시각(포함)과 끝 시각(제외). 한국 시간대를 붙인 ISO 문자열 */
  startAt: string;
  endAt: string;
}

/**
 * 공지 편지 번호가 있을 때만 공지를 띄운다 — Vercel 환경변수 `NEXT_PUBLIC_EVENT_POPUP_LETTER_ID`를 넣고 빼서 켜고 끈다.
 * 편지 번호가 곧 공지 id라 번호를 바꾸면 앞 공지를 닫은 사람에게도 새로 뜬다.
 * 기간은 환경변수가 대신 정하므로 열어 둔다
 */
export const buildEventPopups = (
  letterId = process.env.NEXT_PUBLIC_EVENT_POPUP_LETTER_ID,
): EventPopup[] => {
  const id = Number(letterId);
  if (!letterId || !Number.isInteger(id) || id <= 0) return [];

  return [
    {
      popupId: `letter-${id}`,
      imageUrl: '/images/event/invite-reward.webp',
      imageAlt: '친구 초대 시 최대 10,000원 적립 혜택',
      linkUrl: receivedLetterPath(id),
      startAt: '2026-10-01T00:00:00+09:00',
      endAt: '9999-12-31T00:00:00+09:00',
    },
  ];
};

// 앞에 있는 것이 먼저 뜬다
export const EVENT_POPUPS: EventPopup[] = buildEventPopups();
