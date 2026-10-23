// 홈에서 이벤트 공지의 차례 — 공지는 들어오자마자 가장 먼저 띄우고, 닫힐 때까지 램프·소감·프리뷰를 붙잡는다.
// 강제 업데이트(묻는 중 포함)·할인 시트·동전 연출은 공지보다 먼저다 — 앞의 것은 1순위, 뒤의 둘은 방금 한 행동의 응답이다
interface EventPopupOrderInput {
  /** 공지 응답을 기다리는 중 — 뜰지 모르니 붙잡는다 */
  loading: boolean;
  /** 이번 방문에 띄울 공지가 있다 */
  hasPopup: boolean;
  /** 이번 방문에 띄운 공지를 닫았다 */
  closed: boolean;
  updateFirst: boolean;
  promoOpen: boolean;
  showerHold: boolean;
}

export const eventPopupOrder = ({
  loading,
  hasPopup,
  closed,
  updateFirst,
  promoOpen,
  showerHold,
}: EventPopupOrderInput) => ({
  /** 공지가 뜰지 아직 모르거나, 떠서 아직 안 닫혔다 — 그동안 다른 자동 안내가 기다린다 */
  pending: loading || (hasPopup && !closed),
  /** 앞선 것이 없어 공지가 나설 수 있다 */
  ready: !updateFirst && !promoOpen && !showerHold,
});
