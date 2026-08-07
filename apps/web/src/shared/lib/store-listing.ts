// 스토어 등록 정보 — 앱의 스토어 신원(패키지명·App Store ID)과 거기서 파생한 링크들의 단일 출처
const PLAY_PACKAGE_NAME = 'com.saynow.app';
const APP_STORE_ID = 'id6787414201';

// 웹 링크 — 브라우저에서 여는 스토어 페이지
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE_NAME}`;
export const APP_STORE_URL = `https://apps.apple.com/kr/app/${APP_STORE_ID}`;

// 스토어 앱 스킴 — 웹뷰는 http(s) 밖 스킴을 OS로 넘기므로, 웹뷰 안이 아니라 스토어 앱이 열린다
export const PLAY_STORE_APP_URL = `market://details?id=${PLAY_PACKAGE_NAME}`;
export const APP_STORE_APP_URL = `itms-apps://apps.apple.com/kr/app/${APP_STORE_ID}`;
