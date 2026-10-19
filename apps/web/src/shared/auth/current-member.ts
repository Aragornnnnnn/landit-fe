// 지금 로그인한 회원을 화면이 구독하는 훅 — 같은 선택자를 화면마다 다시 적지 않게 한 곳에 둔다
import { useAuthStore } from './auth-store';

/** 지금 로그인한 회원 id. 로그아웃 상태면 null */
export const useCurrentUserId = () =>
  useAuthStore((state) => state.member?.userId ?? null);

/** 관리자 계정인가 — 개발자 메뉴와 점검 화면을 여는 기준 */
export const useIsAdmin = () =>
  useAuthStore((state) => state.member?.role === 'ADMIN');
