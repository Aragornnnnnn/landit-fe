import type { z } from 'zod';

import {
  nativeToWebMessageSchema,
  webToNativeMessageSchema,
  type NativeToWebMessage,
  type WebToNativeMessage,
} from './messages';

// raw 문자열을 JSON.parse 후 스키마로 대조해 통과하면 객체, 실패하면 null을 반환한다
function parseMessage<T>(schema: z.ZodType<T>, raw: unknown): T | null {
  if (typeof raw !== 'string') return null;

  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// 네이티브가 받은 raw 문자열을 웹→네이티브 메시지로 변환한다. 규격 밖이면 null
export function parseWebToNativeMessage(
  raw: unknown,
): WebToNativeMessage | null {
  return parseMessage(webToNativeMessageSchema, raw);
}

// 웹이 받은 raw 문자열을 네이티브→웹 메시지로 변환한다. 규격 밖이면 null
export function parseNativeToWebMessage(
  raw: unknown,
): NativeToWebMessage | null {
  return parseMessage(nativeToWebMessageSchema, raw);
}

// 메시지 객체를 postMessage로 보낼 JSON 문자열로 만든다
export function serializeBridgeMessage(
  message: WebToNativeMessage | NativeToWebMessage,
): string {
  return JSON.stringify(message);
}
