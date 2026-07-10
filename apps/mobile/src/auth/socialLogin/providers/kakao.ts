// 카카오 로그인 — 네이티브 SDK(카카오톡 앱 전환/자체 웹뷰)로 OIDC id_token을 받는다
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { login as kakaoLogin } from '@react-native-kakao/user';

import {
  assertIdToken,
  hasErrorCode,
  SocialLoginError,
} from '../shared/errors';

let kakaoInitializePromise: Promise<void> | null = null;

// 이메일 등 동의 항목은 콘솔에서 필수 동의라 첫 로그인 동의 화면에 항상 포함된다 (별도 재동의 불필요)
export async function requestKakaoIdToken(nonce: string): Promise<string> {
  await ensureKakaoSdkInitialized();
  const token = await loginWithKakaoTalkOrAccount(nonce);
  return assertIdToken(token.idToken);
}

// 카톡 앱 전환 로그인을 먼저 시도하고, 취소가 아닌 실패면 카카오 계정(웹) 로그인으로 폴백한다
async function loginWithKakaoTalkOrAccount(nonce: string) {
  try {
    // 플랜 A: 카카오톡 앱으로 전환해서 로그인
    return await kakaoLogin({ web: { nonce } });
  } catch (error) {
    throwIfCancelled(error);
  }
  try {
    // 플랜 B: 카톡이 없거나 실패하면 웹뷰에서 카카오 계정으로 로그인
    return await kakaoLogin({ useKakaoAccountLogin: true, web: { nonce } });
  } catch (error) {
    throwIfCancelled(error);
    throw error;
  }
}

function throwIfCancelled(error: unknown): void {
  if (hasErrorCode(error, 'Cancelled')) {
    throw new SocialLoginError('로그인이 취소됐어요.', true);
  }
}

async function ensureKakaoSdkInitialized(): Promise<void> {
  if (kakaoInitializePromise) return kakaoInitializePromise;

  const nativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim();
  if (!nativeAppKey) {
    throw new SocialLoginError('Kakao Native App Key가 설정되지 않았어요.');
  }
  kakaoInitializePromise = initializeKakaoSDK(nativeAppKey);
  return kakaoInitializePromise;
}
