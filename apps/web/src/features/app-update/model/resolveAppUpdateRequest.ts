// 네이티브 컨텍스트로 업데이트 체크 요청을 만든다 — 브라우저거나 버전명이 없으면 체크를 건너뛴다
import type { NativeContext } from '@landit/bridge';

import {
  toApiPlatform,
  type AppPlatform,
  type Surface,
} from '@/shared/bridge/native-context';

export interface AppUpdateRequest {
  platform: AppPlatform;
  versionName: string;
}

// BE가 받는 버전명 형식 — 어긋나면 400이라 요청 전에 거른다
const VERSION_NAME_PATTERN = /^\d+\.\d+\.\d+$/;

// buildNumber는 보지 않는다 — 업데이트 여부는 서버가 versionName으로만 정한다.
// 이미 스토어에 나간 안드로이드 셸은 versionCode를 못 실어 buildNumber가 null인데,
// 여기서 걸러 버리면 정작 업데이트가 필요한 그 유저들에게만 안내가 닿지 않는다
export const resolveAppUpdateRequest = (
  surface: Surface,
  nativeContext: NativeContext | null,
): AppUpdateRequest | null => {
  if (surface !== 'app' || !nativeContext) {
    return null;
  }
  if (!VERSION_NAME_PATTERN.test(nativeContext.appVersion)) {
    return null;
  }
  return {
    platform: toApiPlatform(nativeContext.platform),
    versionName: nativeContext.appVersion,
  };
};
