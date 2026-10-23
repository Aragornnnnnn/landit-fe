// 홈에서 이벤트 공지의 차례 — 공지는 아무것도 나서지 않는 방문에만 띄우고, 램프가 묻는 날엔 램프를 끈 뒤에 띄운다.
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

/** 램프 차례가 끝났나 — 램프가 이번에 묻지 않거나, 물은 램프를 껐다. 그 전엔 공지가 램프 위를 덮지 않는다 */
export const isLampSettled = ({
  pastDay,
  dailyLoaded,
  hasScenario,
  cleared,
  lampSummons,
  summonClosed,
}: {
  /** 지난 날 카드를 보고 있다 — 램프가 자동으로 묻지 않는다 */
  pastDay: boolean;
  dailyLoaded: boolean;
  hasScenario: boolean;
  /** 그날 대화를 끝냈다 — 램프 대신 완료 카드가 뜬다 */
  cleared: boolean;
  /** 램프가 이번 방문에 자동으로 물을지. 아직 정하지 않았으면 null */
  lampSummons: boolean | null;
  summonClosed: boolean;
}) =>
  pastDay ||
  (dailyLoaded && (!hasScenario || cleared)) ||
  lampSummons === false ||
  summonClosed;

interface EventPopupOrderInput {
  /** 공지 응답을 기다리는 중 — 뜰지 모르니 붙잡는다 */
  loading: boolean;
  /** 이번 방문에 띄울 공지가 있다 */
  hasPopup: boolean;
  /** 이번 방문에 띄운 공지를 닫았다 */
  closed: boolean;
  /** 프리뷰 대상인지 아직 모른다 — 프리뷰가 나서면 공지를 건너뛰어야 해서 기다린다 */
  previewDeciding: boolean;
  /** 램프가 이번에 묻지 않거나, 물은 램프를 껐다 — 램프가 묻는 동안 공지가 위를 덮지 않게 */
  lampSettled: boolean;
  updateFirst: boolean;
  promoOpen: boolean;
  showerHold: boolean;
}

export const eventPopupOrder = ({
  loading,
  hasPopup,
  closed,
  previewDeciding,
  lampSettled,
  updateFirst,
  promoOpen,
  showerHold,
}: EventPopupOrderInput) => ({
  /** 공지가 뜰지 아직 모르거나, 떠서 아직 안 닫혔다 — 그동안 소감·알림 동의 같은 시트가 기다린다 */
  pending: loading || previewDeciding || (hasPopup && !closed),
  /** 앞선 것이 없어 공지가 나설 수 있다 */
  ready:
    !updateFirst &&
    !previewDeciding &&
    lampSettled &&
    !promoOpen &&
    !showerHold,
});
