import type { QueryClient } from '@tanstack/react-query';

import type {
  ReferralRegistrationStatus,
  ReferralSummary,
} from '../api/referral';

// 친구 초대의 React Query 키 팩토리 — 키 문자열은 여기서만 만든다. userId를 넣어 계정이 바뀌면 다른 캐시를 본다
export const referralKeys = {
  all: ['referral'] as const,
  summary: (userId: number | null) =>
    [...referralKeys.all, userId, 'summary'] as const,
  code: (userId: number | null) =>
    [...referralKeys.all, userId, 'code'] as const,
  rewards: (userId: number | null) =>
    [...referralKeys.all, userId, 'rewards'] as const,
  preview: (userId: number | null, code: string) =>
    [...referralKeys.all, userId, 'preview', code] as const,
};

// 등록·건너뛰기 결과를 요약에 바로 적는다 — 다시 받기 전에 뒤로 가도 코드 단계가 다시 열리지 않게
export const markRegistrationStatus = (
  queryClient: QueryClient,
  userId: number | null,
  registrationStatus: ReferralRegistrationStatus,
) =>
  queryClient.setQueryData<ReferralSummary>(
    referralKeys.summary(userId),
    (summary) => summary && { ...summary, registrationStatus },
  );

// 발급받은 코드를 요약 캐시에도 심는다 — 요약을 다시 받기 전까지 코드가 null로 남아 또 발급을 묻지 않게
export const rememberReferralCode = (
  queryClient: QueryClient,
  userId: number | null,
  code: string,
) => {
  queryClient.setQueryData(referralKeys.code(userId), code);
  queryClient.setQueryData<ReferralSummary>(
    referralKeys.summary(userId),
    (summary) => summary && { ...summary, code },
  );
};
