import { z } from 'zod';

// 백엔드 SocialProvider enum(GOOGLE/KAKAO/APPLE)과 대응 — 백엔드는 대소문자 무관하게 비교하지만, 프론트 코드 관례상 소문자로 통일
const socialProviderSchema = z.enum(['kakao', 'google', 'apple']);

// 햅틱 패턴 — 의도(성공/오답/선택 등) 기준의 flat enum. 네이티브가 expo-haptics 호출로 매핑한다
//   selection            → selectionAsync (탭 전환·선택지 등 가벼운 틱)
//   light/medium/heavy   → impactAsync(ImpactFeedbackStyle.*)
//   success/warning/error→ notificationAsync(NotificationFeedbackType.*)
export const hapticPatternSchema = z.enum([
  'selection',
  'light',
  'medium',
  'heavy',
  'success',
  'warning',
  'error',
]);

// 웹 → 네이티브로 보낼 수 있는 메시지 목록. type 필드로 종류를 구분한다(discriminated union)
export const webToNativeMessageSchema = z.discriminatedUnion('type', [
  // "더 뒤로 갈 곳 없음"으로 웹이 판단했을 때 보낸다
  z.object({ type: z.literal('EXIT_APP') }),
  // 웹이 로그인 버튼 클릭을 받아 네이티브에 소셜 로그인 SDK 실행을 요청한다
  z.object({
    type: z.literal('SOCIAL_LOGIN_REQUEST'),
    provider: socialProviderSchema,
  }),
  // 웹 인터랙션 시점에 네이티브 햅틱 진동을 요청한다 (단방향, 응답 없음)
  z.object({
    type: z.literal('HAPTIC'),
    pattern: hapticPatternSchema,
  }),
  // 마이크 등 OS 권한이 차단된 상태 — 네이티브가 앱 설정 화면을 연다 (iOS·Android 공통, 단방향)
  z.object({ type: z.literal('OPEN_SETTINGS') }),
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
    // 애플 최초 로그인 1회에만 온다 — 애플은 이름을 id_token에 넣지 않고 이때만 준다
    nickname: z.string().min(1).optional(),
  }),
  // 네이티브 소셜 로그인 SDK 실행이 실패했거나 사용자가 취소했다.
  // cancelled면 웹은 에러 문구를 보여주지 않는다 (필드가 없는 구버전 셸 메시지도 허용해야 해서 optional)
  z.object({
    type: z.literal('SOCIAL_LOGIN_ERROR'),
    message: z.string(),
    cancelled: z.boolean().optional(),
  }),
]);

// 위 스키마에서 자동으로 뽑아낸 타입 — 스키마를 고치면 타입도 같이 바뀐다
export type HapticPattern = z.infer<typeof hapticPatternSchema>;
export type WebToNativeMessage = z.infer<typeof webToNativeMessageSchema>;
export type NativeToWebMessage = z.infer<typeof nativeToWebMessageSchema>;
