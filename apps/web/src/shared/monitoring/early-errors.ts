// Sentry를 받기 전에 난 에러를 모아 두는 버퍼 — 랜딩은 첫 화면 뒤에 Sentry를 받아서, 그 사이 에러를 놓치지 않게 초기화 직후 넘긴다

/** 지금부터 에러·처리 안 된 거절을 모으고, 돌려준 함수로 한 번에 넘긴다. 넘긴 뒤엔 더 모으지 않는다(Sentry가 직접 잡는다) */
export const bufferEarlyErrors = (target: Window) => {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) =>
    errors.push(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) =>
    errors.push(event.reason);
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);

  return (capture: (error: unknown) => void) => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
    for (const error of errors.splice(0)) capture(error);
  };
};
