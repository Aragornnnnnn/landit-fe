// 앱 버전 업데이트 정책 조회 — 백엔드 AppVersionCheckResponse 미러
import { api } from '@/shared/api/client';
import type { AppPlatform } from '@/shared/bridge/native-context';

export type AppUpdateType = 'FORCE' | 'SOFT' | 'NONE';

export interface AppUpdateCheckResponse {
  updateType: AppUpdateType;
  latestVersionName: string;
  latestBuildNumber: number;
  minimumSupportedVersionName: string;
  reason: string | null;
  releasedAt: string;
}

export const checkAppUpdate = (platform: AppPlatform, versionName: string) =>
  api.get<AppUpdateCheckResponse>(
    `/api/v1/app-versions/check?platform=${platform}&versionName=${versionName}`,
  );
