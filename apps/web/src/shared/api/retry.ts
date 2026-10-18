// 조회 재시도 기준 — 4xx는 다시 물어도 답이 같아(없음·권한 없음·기한 지남) 바로 실패로 보여 준다.
// 기본 재시도(3회 지수 백오프)에 맡기면 안내가 뜨기까지 7초를 빈 화면으로 기다린다
import { ApiError } from './api-error';

const MAX_RETRIES = 2;

/** 다시 물으면 결과가 달라질 수 있는 실패인가 — 서버 오류와 네트워크 실패 */
export const isRetriableFailure = (error: Error) =>
  !(error instanceof ApiError) || error.status >= 500;

/** useQuery의 retry 자리에 넣는다. 4xx는 멈추고 나머지는 두 번까지 다시 묻는다 */
export const retryUnlessClientError = (failureCount: number, error: Error) =>
  isRetriableFailure(error) && failureCount < MAX_RETRIES;
