// 소셜 로그인 replay 방지용 nonce를 생성한다 — OIDC id_token에 실려 백엔드가 검증한다
import * as Crypto from 'expo-crypto';

export function generateNonce(): string {
  return Crypto.randomUUID();
}
