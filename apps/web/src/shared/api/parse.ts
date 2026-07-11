// 백엔드 공통 응답 포맷 { success, data, error }
interface ApiBody {
  success: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
}

// 성공이면 data를 돌려주고, 실패면 서버가 준 메시지로 에러를 던진다
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiBody;

  if (body.success) return body.data as T;

  throw new Error(body.error?.message ?? '서버 오류가 발생했어요.');
}
