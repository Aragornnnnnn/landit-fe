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

// buildNumber는 필수 파라미터지만 업데이트 판단에는 쓰이지 않는다 — 기준은 versionName이다
export const checkAppUpdate = (
  platform: AppPlatform,
  versionName: string,
  buildNumber: number,
) =>
  api.get<AppUpdateCheckResponse>(
    `/api/v1/app-versions/check?platform=${platform}&versionName=${versionName}&buildNumber=${buildNumber}`,
  );
