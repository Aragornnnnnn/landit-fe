// 셸이 준 푸시 토큰을 서버에 등록·해제한다. 해제할 때 되돌려 보낼 토큰만 기억한다
import {
  getNativeContext,
  toApiPlatform,
} from '@/shared/bridge/native-context';

import { updateExpoPushToken } from '../api/push-token';

let lastToken: string | null = null;

// 등록·재활성화 — 셸이 없으면(브라우저) 등록할 기기가 없다
export const registerPushToken = async (token: string) => {
  const platform = getNativeContext()?.platform;
  if (!platform) return;

  await updateExpoPushToken({
    platform: toApiPlatform(platform),
    expoPushToken: token,
    enabled: true,
  });
  lastToken = token;
};

// 해제 — 로그아웃·탈퇴처럼 이 기기로 더는 보내면 안 되는 순간에 부른다
export const disablePushToken = async () => {
  const platform = getNativeContext()?.platform;
  if (!platform || !lastToken) return;

  await updateExpoPushToken({
    platform: toApiPlatform(platform),
    expoPushToken: lastToken,
    enabled: false,
  });
  lastToken = null;
};
