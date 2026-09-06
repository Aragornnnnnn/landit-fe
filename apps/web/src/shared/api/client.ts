// API 호출 진입점 — api.get/post/... 로 부르면 토큰 부착·401 재발급을 request가 알아서 처리한다
import { parseApiResponse } from '@/shared/api/parse';
import { REFRESH_PATH, refreshAccessToken } from '@/shared/auth/api/refresh';
import { useAuthStore } from '@/shared/auth/auth-store';
import { clearSession } from '@/shared/auth/clear-session';

/**
 * API 호출 진입점. 로그인 토큰 부착과 401 재발급·1회 재시도를 알아서 처리한다.
 *
 * @typeParam T 성공 응답 `data`의 타입 — 백엔드 응답을 가공 없이 그대로 반환한다
 * @throws ApiError 백엔드가 실패 응답을 주면 (endpoint·status·code 포함 — reportError가 태그로 승격)
 */
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
  // FormData면 Content-Type을 안 붙인다 — 브라우저가 multipart boundary까지 직접 정한다
  const headers = new Headers(
    body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
  );
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // body가 undefined면 JSON.stringify도 undefined라 GET/DELETE에선 body가 안 실린다
  const send = () =>
    fetch(path, {
      method,
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
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
