// Expo 푸시 토큰 등록·해제 — 백엔드 ExpoPushTokenUpdateRequest 미러. PUT 하나가 등록·재활성화·해제를 다 맡는다
import { api } from '@/shared/api/client';
import type { AppPlatform } from '@/shared/bridge/native-context';

export interface ExpoPushTokenUpdateRequest {
  platform: AppPlatform;
  expoPushToken: string;
  /** true면 등록·재활성화, false면 이 기기로 더는 보내지 않는다 */
  enabled: boolean;
}

export const updateExpoPushToken = (body: ExpoPushTokenUpdateRequest) =>
  api.put<null>('/api/v1/me/expo-push-token', body);
