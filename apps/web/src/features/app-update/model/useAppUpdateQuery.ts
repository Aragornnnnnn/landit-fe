// 앱 버전 정책 조회 쿼리 — request가 null이면(브라우저·구버전 셸) 비활성
import { useQuery } from '@tanstack/react-query';

import { checkAppUpdate } from '../api/app-update';
import type { AppUpdateRequest } from './resolveAppUpdateRequest';

export const appUpdateKey = (request: AppUpdateRequest | null) =>
  ['app-update', request?.platform, request?.buildNumber] as const;

export const useAppUpdateQuery = (request: AppUpdateRequest | null) => {
  const { data } = useQuery({
    queryKey: appUpdateKey(request),
    queryFn: () =>
      checkAppUpdate(
        (request as AppUpdateRequest).platform,
        (request as AppUpdateRequest).buildNumber,
      ),
    enabled: request !== null,
    staleTime: Infinity,
    retry: false,
  });

  return { data: data ?? null };
};
