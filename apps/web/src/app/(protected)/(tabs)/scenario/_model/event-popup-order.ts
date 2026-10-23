// 홈에서 이벤트 공지의 차례 — 공지는 아무것도 나서지 않는 방문에만 띄우고, 띄울 땐 램프보다 먼저 띄운다.
// 온보딩 직후·프리미엄 프리뷰·소감 시트가 나설 방문은 그 흐름이 먼저라 공지를 건너뛴다(기록을 안 남겨 다음 방문에 뜬다).
// 강제 업데이트(묻는 중 포함)·할인 시트·동전 연출은 공지보다 먼저다 — 앞의 것은 1순위, 뒤의 둘은 방금 한 행동의 응답이다

/** 이번 방문에 공지를 건너뛸까 — 이미 정해진 흐름이 홈을 차지하는 방문이다 */
export const skipsEventPopup = ({
  onboarded,
  previewTurn,
  satisfactionTurn,
}: {
  /** 온보딩을 막 마치고 와서 바로 대화로 이어진다 */
  onboarded: boolean;
  /** 프리미엄 프리뷰(튜토리얼·카드 뒤집기·무료 표현)가 나설 차례다 */
  previewTurn: boolean;
  /** 이번 방문에 소감·리뷰 시트를 묻는다 */
  satisfactionTurn: boolean;
}) => onboarded || previewTurn || satisfactionTurn;

interface EventPopupOrderInput {
  /** 공지 응답을 기다리는 중 — 뜰지 모르니 붙잡는다 */
  loading: boolean;
  /** 이번 방문에 띄울 공지가 있다 */
  hasPopup: boolean;
  /** 이번 방문에 띄운 공지를 닫았다 */
  closed: boolean;
  /** 프리뷰 대상인지 아직 모른다 — 프리뷰가 나서면 공지를 건너뛰어야 해서 기다린다 */
  previewDeciding: boolean;
  updateFirst: boolean;
  promoOpen: boolean;
  showerHold: boolean;
}

export const eventPopupOrder = ({
  loading,
  hasPopup,
  closed,
  previewDeciding,
  updateFirst,
  promoOpen,
  showerHold,
}: EventPopupOrderInput) => ({
  /** 공지가 뜰지 아직 모르거나, 떠서 아직 안 닫혔다 — 그동안 램프가 기다린다 */
  pending: loading || previewDeciding || (hasPopup && !closed),
  /** 앞선 것이 없어 공지가 나설 수 있다 */
  ready: !updateFirst && !previewDeciding && !promoOpen && !showerHold,
});
