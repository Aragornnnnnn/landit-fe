// 서버가 프리미엄이 없다고 거절했는가 — 입구 판단이 열려 있어도(브라우저·구독 조회 전) 서버는 막는다
import { ApiError } from '@/shared/api/api-error';

export const isPremiumRequired = (cause: unknown) =>
  cause instanceof ApiError && cause.code === 'PREMIUM_REQUIRED';
