// Apple 로그인 — OS가 시트를 띄우고 id_token을 발급한다
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import {
  assertIdToken,
  hasErrorCode,
  SocialLoginError,
} from '../shared/errors';

// 요청한 nonce가 그대로 id_token 클레임에 들어간다
export async function requestAppleIdToken(nonce: string): Promise<string> {
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
    return assertIdToken(credential.identityToken ?? undefined);
  } catch (error) {
    if (hasErrorCode(error, 'ERR_REQUEST_CANCELED')) {
      throw new SocialLoginError('로그인이 취소됐어요.', true);
    }
    throw error;
  }
}
