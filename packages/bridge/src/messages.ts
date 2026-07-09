import { z } from 'zod';

// 웹 → 네이티브로 보낼 수 있는 메시지 목록. type 필드로 종류를 구분한다(discriminated union)
export const webToNativeMessageSchema = z.discriminatedUnion('type', [
  // "더 뒤로 갈 곳 없음"으로 웹이 판단했을 때 보낸다
  z.object({ type: z.literal('EXIT_APP') }),
]);

// 네이티브 → 웹으로 보낼 수 있는 메시지 목록
export const nativeToWebMessageSchema = z.discriminatedUnion('type', [
  // Android 하드웨어 뒤로가기 이벤트를 웹에 전달한다
  z.object({ type: z.literal('BACK_PRESSED') }),
]);

// 위 스키마에서 자동으로 뽑아낸 타입 — 스키마를 고치면 타입도 같이 바뀐다
export type WebToNativeMessage = z.infer<typeof webToNativeMessageSchema>;
export type NativeToWebMessage = z.infer<typeof nativeToWebMessageSchema>;
