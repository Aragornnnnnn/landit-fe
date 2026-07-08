import { z } from 'zod';

// 백엔드 SocialProvider enum(GOOGLE/KAKAO/APPLE)과 대응 — 백엔드는 대소문자 무관하게 비교하지만, 프론트 코드 관례상 소문자로 통일
const socialProviderSchema = z.enum(['kakao', 'google', 'apple']);

// 웹 → 네이티브로 보낼 수 있는 메시지 목록. type 필드로 종류를 구분한다(discriminated union)
export const webToNativeMessageSchema = z.discriminatedUnion('type', [
  // "더 뒤로 갈 곳 없음"으로 웹이 판단했을 때 보낸다
  z.object({ type: z.literal('EXIT_APP') }),
  // 웹이 로그인 버튼 클릭을 받아 네이티브에 소셜 로그인 SDK 실행을 요청한다
  z.object({
    type: z.literal('SOCIAL_LOGIN_REQUEST'),
    provider: socialProviderSchema,
  }),
]);

// 네이티브 → 웹으로 보낼 수 있는 메시지 목록
export const nativeToWebMessageSchema = z.discriminatedUnion('type', [
  // Android 하드웨어 뒤로가기 이벤트를 웹에 전달한다
  z.object({ type: z.literal('BACK_PRESSED') }),
  // 네이티브 소셜 로그인 SDK가 idToken을 발급받았다 — 웹이 이걸로 /social-login을 호출한다.
  z.object({
    type: z.literal('SOCIAL_LOGIN_SUCCESS'),
    provider: socialProviderSchema,
    idToken: z.string().min(1),
    nonce: z.string().min(1),
  }),
  // 네이티브 소셜 로그인 SDK 실행이 실패했거나 사용자가 취소했다
  z.object({
    type: z.literal('SOCIAL_LOGIN_ERROR'),
    message: z.string(),
  }),
]);

// 위 스키마에서 자동으로 뽑아낸 타입 — 스키마를 고치면 타입도 같이 바뀐다
export type WebToNativeMessage = z.infer<typeof webToNativeMessageSchema>;
export type NativeToWebMessage = z.infer<typeof nativeToWebMessageSchema>;
