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

// 알림 권한 상태 — expo-notifications의 PermissionStatus와 대응
export const notificationPermissionStatusSchema = z.enum([
  'granted',
  'denied',
  'undetermined',
]);

// 홈 위젯에 보여줄 데이터 — 셸이 공유 저장소(App Group/AsyncStorage)에 기록하고 위젯이 읽는다.
// 날짜는 전부 Asia/Seoul 기준 yyyy-MM-dd. 상태 판정(시간표·몰락 단계)은 위젯 쪽이 현재 시각으로 계산한다
export const widgetDataSchema = z.object({
  // 현재 스트릭 수 — 배지 숫자. 끊긴 직후(⑨)엔 마지막으로 알던 값이 직전 스트릭 표시로 쓰인다
  streak: z.number().int().min(0),
  // 오늘 대화 완료 여부 — 상태 사다리 1번 분기
  todayDone: z.boolean(),
  // 마지막 대화 완료 날짜 — 몰락 단계(끊긴 지 며칠)를 위젯이 스스로 계산하는 근거. 완료 이력 없으면 null.
  // 형식뿐 아니라 실제 존재하는 날짜인지도 본다 — 2026-02-31 같은 값이 통과하면 경과 일수 계산이 어긋난다
  lastCompletedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (value) => new Date(`${value}T00:00:00Z`).toISOString().startsWith(value),
      { message: '달력에 없는 날짜예요' },
    )
    .nullable(),
  // 오늘 카드 제목 — Medium 미완료 화면의 부제. 발행 전이면 null
  todayCardTitle: z.string().min(1).nullable(),
  // 오늘 포함 최근 7일 완료 여부 (과거→오늘 순) — Large 주간 스트립
  weeklyDone: z.array(z.boolean()).length(7),
  // 이 값들이 며칠 기준인지 — 서버가 준 오늘(/me/streak의 today). 로그인 전 빈 값이면 null.
  // 위젯은 이 날짜가 지금의 오늘과 다르면 날짜에 묶인 표시(카드 제목·주간 라벨)를 그날 기준으로 되돌린다
  capturedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (value) => new Date(`${value}T00:00:00Z`).toISOString().startsWith(value),
      { message: '달력에 없는 날짜예요' },
    )
    .nullable(),
});

// 로그인 전·로그아웃 후에 쓰는 빈 값 — 웹이 이걸 보내 셸에 남은 이전 사용자 기록을 지운다.
// 완료 이력이 없으므로(null) 위젯은 몰락 연출 없이 0일 시간표만 그린다
export const EMPTY_WIDGET_DATA = {
  streak: 0,
  todayDone: false,
  lastCompletedDate: null,
  todayCardTitle: null,
  weeklyDone: [false, false, false, false, false, false, false],
  capturedOn: null,
} as const satisfies z.infer<typeof widgetDataSchema>;

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
  // [한시] 구 셸(로컬 리마인더 시절)에 남은 예약을 지우는 정리 신호 — 빈 배열만 허용한다.
  // 구 셸은 "전부 해제"로 처리하고, 새 셸은 핸들러가 없어 무시한다. 구 바이너리가 소멸하면 웹 발신과 함께 제거한다
  z.object({
    type: z.literal('SYNC_REMINDERS'),
    reminders: z.array(z.never()),
  }),
  // 알림 권한 상태 조회 — 다이얼로그를 띄우지 않는다. 응답은 NOTIFICATION_PERMISSION
  z.object({ type: z.literal('GET_NOTIFICATION_PERMISSION') }),
  // 알림 권한 능동 요청 — OS 권한창을 띄울 수 있다. 응답은 NOTIFICATION_PERMISSION
  z.object({ type: z.literal('REQUEST_NOTIFICATION_PERMISSION') }),
  // 홈 위젯 데이터를 셸에 동기화한다 — 셸은 저장 후 위젯 새로고침을 요청한다 (단방향)
  z.object({
    type: z.literal('SYNC_WIDGET_DATA'),
    data: widgetDataSchema,
  }),
  // 홈 위젯 설치 다이얼로그를 요청한다 — Android만 시스템 핀 요청을 띄운다 (iOS는 그런 API가 없어 무시)
  z.object({ type: z.literal('REQUEST_WIDGET_PIN') }),
  // 앱을 홈 화면으로 내린다 — iOS만. 위젯 설치 안내 끝에 사용자가 직접 위젯을 얹으러 나가게 한다
  z.object({ type: z.literal('GO_HOME') }),
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
  // GET/REQUEST_NOTIFICATION_PERMISSION에 대한 응답 — 현재 알림 권한 상태를 알린다
  z.object({
    type: z.literal('NOTIFICATION_PERMISSION'),
    status: notificationPermissionStatusSchema,
  }),
  // 셸이 발급받은 푸시 토큰을 웹에 전달한다 — 웹이 백엔드에 등록한다
  z.object({
    type: z.literal('PUSH_TOKEN'),
    token: z.string().min(1),
  }),
  // 앱이 떠 있는 상태에서 알림을 탭했을 때 — 웹 라우터가 이 경로로 이동한다
  z.object({
    type: z.literal('NAVIGATE'),
    url: z.string().min(1),
  }),
]);

// 위 스키마에서 자동으로 뽑아낸 타입 — 스키마를 고치면 타입도 같이 바뀐다
export type HapticPattern = z.infer<typeof hapticPatternSchema>;
export type WidgetData = z.infer<typeof widgetDataSchema>;
export type NotificationPermissionStatus = z.infer<
  typeof notificationPermissionStatusSchema
>;
export type WebToNativeMessage = z.infer<typeof webToNativeMessageSchema>;
export type NativeToWebMessage = z.infer<typeof nativeToWebMessageSchema>;
