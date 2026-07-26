// 네이티브 컨텍스트를 읽어 앱 업데이트 정책을 조회한다 — BE updateType을 그대로 전달한다
import type { AppUpdateType } from '@/features/app-update/api/app-update';
import { resolveAppUpdateRequest } from '@/features/app-update/model/resolveAppUpdateRequest';
import { useAppUpdateQuery } from '@/features/app-update/model/useAppUpdateQuery';
import { getNativeContext, getSurface } from '@/shared/bridge/native-context';

export const useAppUpdateCheck = (): {
  updateType: AppUpdateType;
  reason: string | null;
} => {
  const request = resolveAppUpdateRequest(getSurface(), getNativeContext());
  const { data } = useAppUpdateQuery(request);

  if (!data) return { updateType: 'NONE', reason: null };
  return { updateType: data.updateType, reason: data.reason };
};
