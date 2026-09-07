// 브릿지 왕복 한 번 — 회신을 기다리되, 보낼 곳이 없거나 시간이 지나면 null로 끝낸다
import type { NativeToWebMessage } from '@landit/bridge';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestFromNative, type BridgeTransport } from './bridge-request';

type Listener = (message: NativeToWebMessage) => void;

// 셸 대역 — 웹이 보낸 요청을 기록하고, 테스트가 원하는 때에 회신을 흘려 넣는다
const fakeBridge = (canPost = true) => {
  const listeners = new Set<Listener>();
  const sent: unknown[] = [];
  const transport: BridgeTransport = {
    post: (message) => {
      sent.push(message);
      return canPost;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const emit = (message: NativeToWebMessage) =>
    listeners.forEach((listener) => listener(message));
  return { transport, sent, emit, listenerCount: () => listeners.size };
};

const pickPurchaseResult = (message: NativeToWebMessage) =>
  message.type === 'PURCHASE_RESULT' ? message : null;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('requestFromNative', () => {
  it('요청을 보내고 맞는 회신이 오면 그것으로 끝낸다 — 다른 메시지는 지나친다', async () => {
    const bridge = fakeBridge();

    const pending = requestFromNative(
      bridge.transport,
      { type: 'PURCHASE', packageId: '$rc_annual' },
      pickPurchaseResult,
      1000,
    );
    bridge.emit({ type: 'BACK_PRESSED' });
    bridge.emit({ type: 'PURCHASE_RESULT', status: 'success' });

    await expect(pending).resolves.toEqual({
      type: 'PURCHASE_RESULT',
      status: 'success',
    });
    expect(bridge.sent).toEqual([
      { type: 'PURCHASE', packageId: '$rc_annual' },
    ]);
    expect(bridge.listenerCount()).toBe(0);
  });

  it('보낼 곳이 없으면(브라우저) 기다리지 않고 null이다', async () => {
    const bridge = fakeBridge(false);

    await expect(
      requestFromNative(
        bridge.transport,
        { type: 'GET_OFFERINGS' },
        pickPurchaseResult,
        1000,
      ),
    ).resolves.toBeNull();
    expect(bridge.listenerCount()).toBe(0);
  });

  it('제한 시간 안에 회신이 없으면 null로 끝내고 구독을 거둔다', async () => {
    const bridge = fakeBridge();

    const pending = requestFromNative(
      bridge.transport,
      { type: 'RESTORE_PURCHASES' },
      pickPurchaseResult,
      1000,
    );
    await vi.advanceTimersByTimeAsync(1000);

    await expect(pending).resolves.toBeNull();
    expect(bridge.listenerCount()).toBe(0);
  });
});
