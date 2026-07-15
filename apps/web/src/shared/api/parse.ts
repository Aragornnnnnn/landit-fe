// 백엔드 공통 응답 포맷 { success, data, error }
interface ApiBody {
  success: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
}

// 성공이면 data를 돌려주고, 실패면 서버가 준 메시지로 에러를 던진다.
// 래퍼가 안 씌워진 에러(스프링 기본 404/500 등)는 메시지가 없으므로 상태코드를 붙여 원인을 드러낸다.
export async function parseApiResponse<T>(response: Response): Promise<T> {
  let body: ApiBody | null = null;
  try {
    body = (await response.json()) as ApiBody;
  } catch {
    // JSON이 아닌 응답(스프링 기본 에러 페이지 등) — 아래 상태코드 분기로 처리
  }

  if (body?.success) return body.data as T;

  if (body?.error?.message) throw new Error(body.error.message);

  throw new Error(
    response.status
      ? `서버 오류가 발생했어요. (${response.status})`
      : '서버 오류가 발생했어요.',
  );
}
