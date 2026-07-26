// 백엔드 공통 응답 포맷 { success, data, error }
import { ApiError } from './api-error';

interface ApiBody {
  success: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
}

// 호스트·쿼리를 떼고 경로만 — 같은 API 실패를 한 태그로 모은다
function endpointOf(response: Response): string {
  return new URL(response.url).pathname;
}

// 성공이면 data를 돌려주고, 실패면 상태·코드·엔드포인트를 보존한 ApiError를 던진다
export async function parseApiResponse<T>(response: Response): Promise<T> {
  let body: ApiBody | null = null;
  try {
    body = (await response.json()) as ApiBody;
  } catch {
    // JSON이 아닌 응답(스프링 기본 에러 페이지 등) — 아래 상태코드 분기로 처리
  }

  if (body?.success) return body.data as T;

  throw new ApiError(
    // 공통 봉투 없이 온 실패(스프링 기본 에러 페이지 등)는 상태코드를 붙인 기본 문구로
    body?.error?.message ?? `서버 오류가 발생했어요. (${response.status})`,
    response.status,
    endpointOf(response),
    body?.error?.code,
  );
}
