// 브라우저용 MSW 워커 — 서비스워커로 fetch를 가로채 mock 응답을 준다
import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
