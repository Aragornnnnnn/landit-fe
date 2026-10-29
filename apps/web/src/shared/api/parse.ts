// 백엔드 공통 응답 포맷 { success, data, error }
import { commonTranslator } from '@/shared/i18n/common-translator';
import { localeFromDocument } from '@/shared/i18n/locale';

import { ApiError } from './api-error';

interface ApiBody {
  success: boolean;
  data?: unknown;
  error?: { code?: string; message?: string };
}

// 서버 메시지를 화면에 그대로 써도 되는지 — 서버가 아직 한국어로만 주는 곳이 있어, 한국어 화면이 아니면 한글이 든 메시지는 쓰지 않는다
const HANGUL = /[가-힣]/;
const fitsScreen = (message: string) =>
  localeFromDocument() === 'ko' || !HANGUL.test(message);

// 쓸 메시지가 없을 때의 기본 문구 — 공통 봉투 없이 온 실패(스프링 기본 에러 페이지 등)는 서버 오류,
// 화면 언어와 다른 메시지를 대신할 때는 4xx면 요청 오류·5xx면 서버 오류다. 둘 다 상태코드를 붙인다
const fallbackMessage = (message: string | undefined, status: number) =>
  commonTranslator()(
    message && status < 500 ? 'api.requestError' : 'api.serverError',
    { status },
  );

// 호스트·쿼리를 떼고 경로만 — 같은 API 실패를 한 태그로 모은다
function endpointOf(response: Response): string {
  return new URL(response.url).pathname;
}

/**
 * 백엔드 공통 응답 봉투(`{ success, data, error }`)를 해석한다.
 *
 * @typeParam T 성공 시 `data`의 타입 — 호출부가 기대하는 타입을 그대로 신뢰한다 (런타임 검증 없음)
 * @throws ApiError 실패 응답이거나 공통 봉투가 아닌 응답(스프링 기본 에러 페이지 등)이면
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  let body: ApiBody | null = null;
  try {
    body = (await response.json()) as ApiBody;
  } catch {
    // JSON이 아닌 응답(스프링 기본 에러 페이지 등) — 아래 상태코드 분기로 처리
  }

  if (body?.success) return body.data as T;

  const message = body?.error?.message;
  throw new ApiError(
    message && fitsScreen(message)
      ? message
      : fallbackMessage(message, response.status),
    response.status,
    endpointOf(response),
    body?.error?.code,
  );
}
