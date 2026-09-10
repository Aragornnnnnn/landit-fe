'use client';

// 브릿지 왕복 한 번을 Promise로 — 회신 구독을 먼저 걸고 요청을 보낸 뒤, 기다리던 종류의 회신 하나로 끝낸다
import type { NativeToWebMessage, WebToNativeMessage } from '@landit/bridge';

import { postToNative, subscribeFromNative } from './web-bridge';

/** 회신 메시지 종류(type) 하나로 좁힌 네이티브→웹 메시지 */
export type NativeReply<K extends NativeToWebMessage['type']> = Extract<
  NativeToWebMessage,
  { type: K }
>;

export interface NativeRequestOptions<K extends NativeToWebMessage['type']> {
  /** 셸에 보낼 요청 */
  request: WebToNativeMessage;
  /** 기다릴 회신의 type — 이 종류의 첫 메시지를 결과로 삼고 다른 메시지는 지나친다 */
  replyType: K;
  /** 이 시간 안에 회신이 없으면 null로 끝낸다 */
  timeoutMs: number;
  /** 끊기면 즉시 null로 끝내고 구독·타이머를 거둔다 — 화면이 사라질 때 넘긴다 */
  signal?: AbortSignal;
}

/**
 * 셸에 요청 하나를 보내고 그 회신을 기다린다.
 *
 * 보낼 곳이 없거나(일반 브라우저), 제한 시간이 지나거나, signal이 끊기면 null이다.
 * 어느 경우든 회신 구독과 타이머는 남기지 않는다.
 *
 * @returns 기다리던 종류의 회신, 또는 못 받았으면 null
 */
export const requestFromNative = <K extends NativeToWebMessage['type']>({
  request,
  replyType,
  timeoutMs,
  signal,
}: NativeRequestOptions<K>): Promise<NativeReply<K> | null> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    let settled = false;
    let unsubscribe = () => {};
    // 브라우저 경로에서는 요청이 실패해 타이머를 걸기 전에 끝날 수 있어 나중에 채운다
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const finish = (value: NativeReply<K> | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      signal?.removeEventListener('abort', giveUp);
      resolve(value);
    };
    function giveUp() {
      finish(null);
    }

    unsubscribe = subscribeFromNative((message) => {
      if (message.type === replyType) finish(message as NativeReply<K>);
    });
    signal?.addEventListener('abort', giveUp);

    if (!postToNative(request)) {
      finish(null);
      return;
    }
    timer = setTimeout(giveUp, timeoutMs);
  });
