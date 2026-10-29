// 웹 계측 진입점 — 이벤트 발화(track·sendAdEvent)와 루트 배선 컴포넌트를 노출한다
export { sendAdEvent, sendAdEventOnce } from './ad-event';
export { setUserProperties, track } from './amplitude';
export { AnalyticsBootstrap } from './AnalyticsBootstrap';
export { LanguagePropertySync } from './LanguagePropertySync';
export { PageViewTracker } from './PageViewTracker';
export { TrackingStatusSync } from './TrackingStatusSync';
