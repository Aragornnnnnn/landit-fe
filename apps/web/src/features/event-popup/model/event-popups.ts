// 홈에 띄울 이벤트 공지 팝업 목록 — 백엔드 API가 생기기 전까지 여기에 직접 등록한다.
// 모양은 나중에 받을 API 응답과 맞춰 두어, API로 바꿀 때 이 목록을 응답으로 갈아 끼우기만 하면 된다

export interface EventPopup {
  /** 반응한 기록의 열쇠 — 같은 공지를 다시 띄우려면 새 id로 등록한다 */
  popupId: string;
  /** 가로 4:3 한 장(1200×900 권장). 문구까지 넣되 위쪽 두 모서리는 둥글게 잘리니 글자를 붙이지 않는다 */
  imageUrl: string;
  /** 스크린 리더가 읽을 이미지 설명 — 이미지에 쓴 문구를 그대로 적는다 */
  imageAlt: string;
  /** 「자세히 보기」로 갈 앱 안 경로 (예: /mailbox/letters/12) */
  linkUrl: string;
  /** 노출 시작 시각(포함)과 끝 시각(제외). 한국 시간대를 붙인 ISO 문자열 */
  startAt: string;
  endAt: string;
}

// 앞에 있는 것이 먼저 뜬다. 끝난 공지는 지워도 되고 그대로 둬도 기간이 지나면 안 뜬다
export const EVENT_POPUPS: EventPopup[] = [];
