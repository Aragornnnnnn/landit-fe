// @vitest-environment jsdom
// 초기화 전 에러 버퍼 — Sentry를 늦게 받는 사이 난 에러를 모았다가 넘기고, 넘긴 뒤엔 더 모으지 않는지 검증
import { describe, expect, it, vi } from 'vitest';

import { bufferEarlyErrors } from './early-errors';

const rejectionOf = (reason: unknown) => {
  const event = new Event('unhandledrejection');
  Object.assign(event, { reason });
  return event;
};

describe('bufferEarlyErrors', () => {
  it('넘기기 전에 난 에러와 처리 안 된 거절을 순서대로 넘긴다', () => {
    // Given 버퍼를 켠 뒤 에러 하나와 거절 하나가 났을 때
    const flush = bufferEarlyErrors(window);
    const error = new Error('boom');
    window.dispatchEvent(new ErrorEvent('error', { error, message: 'boom' }));
    window.dispatchEvent(rejectionOf('nope'));

    // When Sentry가 준비돼 넘기면
    const capture = vi.fn();
    flush(capture);

    // Then 난 순서대로 받는다
    expect(capture.mock.calls).toEqual([[error], ['nope']]);
  });

  it('에러 객체가 없는 에러(다른 출처 스크립트)는 메시지로 넘긴다', () => {
    const flush = bufferEarlyErrors(window);
    window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));

    const capture = vi.fn();
    flush(capture);

    expect(capture).toHaveBeenCalledWith('Script error.');
  });

  it('넘긴 뒤에 난 에러는 모으지 않는다 — 그때부턴 Sentry가 직접 잡는다', () => {
    const flush = bufferEarlyErrors(window);
    const capture = vi.fn();
    flush(capture);

    // 버퍼가 빠진 뒤라 이 에러를 받는 곳이 없다 — jsdom이 미처리 에러로 보고하지 않게 여기서 삼킨다
    window.addEventListener('error', (event) => event.preventDefault(), {
      once: true,
    });
    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('later') }),
    );
    flush(capture);

    expect(capture).not.toHaveBeenCalled();
  });
});
