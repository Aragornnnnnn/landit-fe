// 백엔드 액세스 토큰(JWT)의 payload에서 유저 id를 읽는다 — 백엔드가 `sub`에 userId를 문자열로 넣는다.
// 서명은 여기서 못 본다(키가 백엔드에만 있다). 진짜 토큰인지는 라우트가 백엔드에 한 번 물어 확인한다
export const readUserId = (token: string): number | null => {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    );
    if (typeof claims !== 'object' || claims === null) return null;
    const sub = (claims as { sub?: unknown }).sub;
    // 백엔드가 넣는 그대로의 십진수만 — ''·공백·16진수는 Number()가 엉뚱한 수로 읽는다
    if (typeof sub !== 'string' || !/^\d+$/.test(sub)) return null;
    const userId = Number(sub);
    // 자바스크립트 숫자로 정확히 담기는 범위만 — 넘치면 반올림된 남의 id로 저장될 수 있다
    return Number.isSafeInteger(userId) ? userId : null;
  } catch {
    return null;
  }
};
