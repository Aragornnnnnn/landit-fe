// 알림 페이로드에서 웹 딥링크 경로를 꺼낸다 — 발송자가 채우는 값이라 내부 절대 경로만 믿는다
// '/'로 시작하되 두 번째 글자가 / 나 \ 면('//host'·'/\host') 브라우저가 외부 사이트로 해석해 제외한다
const INTERNAL_PATH_PATTERN = /^\/(?![/\\])/;

export const extractNotificationPath = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null) return null;

  const { url } = data as Record<string, unknown>;
  const isInternalPath =
    typeof url === 'string' && INTERNAL_PATH_PATTERN.test(url);

  return isInternalPath ? url : null;
};
