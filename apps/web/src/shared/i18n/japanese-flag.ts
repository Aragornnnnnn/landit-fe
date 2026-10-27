// 일본어 출시 스위치 — 켜기 전에는 일본어 기기도 한국어로 보고, 서버 프로필 언어도 보내지 않는다.
// 문구·백엔드·AI가 갖춰지기 전에 기반 코드를 먼저 배포해도 사용자에게 언어가 섞이지 않게 한다
// NEXT_PUBLIC_이라 빌드 시점에 박힌다. 바꾸면 재배포가 필요하다
export const JAPANESE_ENABLED =
  process.env.NEXT_PUBLIC_JAPANESE_ENABLED === 'true';
