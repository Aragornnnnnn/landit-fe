// Apple 로그인 — OS가 시트를 띄우고 id_token을 발급한다
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import {
  assertIdToken,
  hasErrorCode,
  SocialLoginError,
} from '../shared/errors';

export interface AppleLoginResult {
  idToken: string;
  // 애플은 이름을 최초 로그인 1회만 credential로 주고 id_token에는 넣지 않는다 — 이후 로그인은 undefined
  name?: string;
}

// 이름 조각(성·이름 등)을 iOS 로케일 규칙으로 한 문자열로 합친다 ("김준서" / "John Appleseed")
function formatFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined {
  if (!fullName) return undefined;
  const formatted = AppleAuthentication.formatFullName(fullName).trim();
  return formatted || undefined;
}

// 요청한 nonce가 그대로 id_token 클레임에 들어간다
export async function requestAppleLogin(
  nonce: string,
): Promise<AppleLoginResult> {
  if (Platform.OS !== 'ios') {
    throw new SocialLoginError('Apple 로그인은 iOS에서만 지원돼요.');
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });
    return {
      idToken: assertIdToken(credential.identityToken ?? undefined),
      name: formatFullName(credential.fullName),
    };
  } catch (error) {
    if (hasErrorCode(error, 'ERR_REQUEST_CANCELED')) {
      throw new SocialLoginError('로그인이 취소됐어요.', true);
    }
    throw error;
  }
}
