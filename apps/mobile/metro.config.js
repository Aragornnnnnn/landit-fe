// Metro 설정 — Sentry가 릴리즈 빌드에서 소스맵에 디버그 ID를 심게 기본 Expo 설정을 감싼다
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// 웹 전용 세션 리플레이(rrweb, 300KB+)는 네이티브에서 no-op이라 번들에서 뺀다
module.exports = getSentryExpoConfig(__dirname, { includeWebReplay: false });
