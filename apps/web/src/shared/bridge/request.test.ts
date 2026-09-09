// 브릿지 왕복 한 번 — 회신을 기다리되, 보낼 곳이 없거나 시간이 지나거나 끊기면 null로 끝내고 구독을 거둔다
import type { NativeToWebMessage } from '@landit/bridge';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestFromNative } from './request';

type Listener = (message: NativeToWebMessage) => void;

// 셸 대역 — 웹이 보낸 요청을 기록하고, 테스트가 원하는 때에 회신을 흘려 넣는다
const shell = vi.hoisted(() => ({
  listeners: new Set<(message: unknown) => void>(),
  sent: [] as unknown[],
  canPost: true,
}));

vi.mock('./web-bridge', () => ({
  postToNative: (message: unknown) => {
    shell.sent.push(message);
    return shell.canPost;
  },
  subscribeFromNative: (listener: (message: unknown) => void) => {
    shell.listeners.add(listener);
    return () => shell.listeners.delete(listener);
  },
}));

const emit = (message: NativeToWebMessage) =>
  shell.listeners.forEach((listener) => (listener as Listener)(message));

beforeEach(() => {
  vi.useFakeTimers();
  shell.listeners.clear();
  shell.sent = [];
  shell.canPost = true;
});
afterEach(() => vi.useRealTimers());

describe('requestFromNative', () => {
  it('요청을 보내고 기다리던 종류의 회신이 오면 그것으로 끝낸다 — 다른 메시지는 지나친다', async () => {
    const pending = requestFromNative({
      request: { type: 'PURCHASE', packageId: '$rc_annual' },
      replyType: 'PURCHASE_RESULT',
      timeoutMs: 1000,
    });
    emit({ type: 'BACK_PRESSED' });
    emit({ type: 'PURCHASE_RESULT', status: 'success' });

    await expect(pending).resolves.toEqual({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    expect(shell.sent).toEqual([{ type: 'PURCHASE', packageId: '$rc_annual' }]);
    expect(shell.listeners.size).toBe(0);
  });

  it('보낼 곳이 없으면(브라우저) 기다리지 않고 null이다', async () => {
    shell.canPost = false;

    await expect(
      requestFromNative({
        request: { type: 'GET_OFFERINGS' },
        replyType: 'OFFERINGS',
        timeoutMs: 1000,
      }),
    ).resolves.toBeNull();
    expect(shell.listeners.size).toBe(0);
  });

  it('제한 시간 안에 회신이 없으면 null로 끝내고 구독을 거둔다', async () => {
    const pending = requestFromNative({
      request: { type: 'RESTORE_PURCHASES' },
      replyType: 'RESTORE_RESULT',
      timeoutMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBeNull();
    expect(shell.listeners.size).toBe(0);
  });

  it('signal이 끊기면 그 자리에서 null로 끝내고, 늦게 온 회신은 무시한다', async () => {
    const controller = new AbortController();
    const pending = requestFromNative({
      request: { type: 'PURCHASE', packageId: '$rc_annual' },
      replyType: 'PURCHASE_RESULT',
      timeoutMs: 1000,
      signal: controller.signal,
    });

    controller.abort();
    emit({ type: 'PURCHASE_RESULT', status: 'success' });

    await expect(pending).resolves.toBeNull();
    expect(shell.listeners.size).toBe(0);
  });
});
