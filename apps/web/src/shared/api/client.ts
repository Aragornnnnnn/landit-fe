// API 호출 진입점 — api.get/post/... 로 부르면 토큰 부착·401 재발급을 request가 알아서 처리한다
import { REFRESH_PATH, refreshAccessToken } from '@/shared/api/auth/refresh';
import { parseApiResponse } from '@/shared/api/parse';
import { clearSession } from '@/shared/lib/clear-session';
import { useAuthStore } from '@/shared/store/auth-store';

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// 모든 메서드가 공유하는 엔진 — 로그인 토큰을 붙이고, 401이면 새로 발급받아 딱 한 번 재시도한다
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const { accessToken, refreshToken } = useAuthStore.getState();
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // body가 undefined면 JSON.stringify도 undefined라 GET/DELETE에선 body가 안 실린다
  const send = () =>
    fetch(path, { method, headers, body: JSON.stringify(body) });
  const response = await send();

  // 토큰이 만료됐으면(401) 새로 발급받아 다시 시도한다
  if (response.status === 401 && refreshToken && path !== REFRESH_PATH) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return parseApiResponse<T>(await send());
    }
    // refresh까지 실패 = 세션 끝. 정리하고 로그인 화면으로 보낸다
    clearSession();
    window.location.href = '/login';
    throw new Error('세션이 만료됐어요. 다시 로그인해 주세요.');
  }

  return parseApiResponse<T>(response);
}
