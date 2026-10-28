// 앱 버전 정책 조회 쿼리 — request가 null이면(브라우저·버전명 없음) 비활성
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { checkAppUpdate } from '../api/app-update';
import type { AppUpdateRequest } from './resolveAppUpdateRequest';

// 사유(reason)는 서버가 화면 언어로 준다 — 언어가 바뀌면 그 언어의 사유를 새로 받게 키에 넣는다
export const appUpdateKey = (
  request: AppUpdateRequest | null,
  locale: string,
) => ['app-update', request?.platform, request?.versionName, locale] as const;

export const useAppUpdateQuery = (request: AppUpdateRequest | null) => {
  const locale = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: appUpdateKey(request, locale),
    queryFn: () =>
      checkAppUpdate(
        (request as AppUpdateRequest).platform,
        (request as AppUpdateRequest).versionName,
      ),
    enabled: request !== null,
    staleTime: Infinity,
    retry: false,
  });

  // 묻는 중인가 — 비활성(브라우저)이면 묻지 않으므로 false다
  return { data: data ?? null, checking: isLoading };
};
