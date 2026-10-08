// 앱 설치별 푸시 상태 동기화 — 백엔드 PushDeviceUpdateRequest 미러. 설치 하나에 현재 계정·토큰 하나만 묶인다
import { api } from '@/shared/api/client';
import type { AppPlatform } from '@/shared/bridge/native-context';

export interface PushDeviceUpdateRequest {
  platform: AppPlatform;
  /** pushEnabled가 true면 필수, false면 생략한다 */
  expoPushToken?: string;
  pushEnabled: boolean;
}

export const updatePushDevice = (
  installationId: string,
  body: PushDeviceUpdateRequest,
) => api.put<null>(`/api/v1/me/push-devices/${installationId}`, body);
