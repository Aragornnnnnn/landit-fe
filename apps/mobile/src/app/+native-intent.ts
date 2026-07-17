// OAuth 콜백 딥링크가 라우터 화면 전환(Unmatched Route)으로 이어지지 않게 막는다
// null 반환 = 화면 전환 없음. expo-auth-session은 Linking 이벤트를 따로 받아 로그인은 정상 진행된다.
import { isOAuthRedirectUrl } from '../auth/socialLogin/shared/redirect';

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string | null {
  // 이 함수에서 throw가 새어 나가면 앱이 죽을 수 있다 (expo-router 문서 권고로 방어)
  try {
    return isOAuthRedirectUrl(path) ? null : path;
  } catch {
    return path;
  }
}
