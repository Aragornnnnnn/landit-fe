// 이벤트 공지 팝업 API — 응답 타입은 백엔드 계약(LAN-740)을 그대로 미러하고, 호출은 그 아래에 둔다
import { api } from '@/shared/api/client';

/** 지금 띄울 팝업 하나 (`GET /popups/active`). 어드민이 켠 것 중 기간 안·우선순위 높은 것을 서버가 고른다 */
export interface ActivePopup {
  popupId: number;
  /** 가로 4:3 이미지. 문구까지 이미지에 들어 있다 */
  imageUrl: string;
  /** 앱 안 절대 경로(/mailbox/...) 또는 https 주소. 누를 곳이 없는 팝업이면 null */
  linkUrl: string | null;
}

/** 띄울 팝업이 없으면 data가 null이다 */
export const getActivePopup = () =>
  api.get<ActivePopup | null>('/api/v1/popups/active');
