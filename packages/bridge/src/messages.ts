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

// 알림 권한 상태 — expo-notifications의 PermissionStatus와 대응. 알람(AlarmKit) 권한도 같은 세 상태로 알린다
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
  // 오늘 포함 최근 7일 완료 여부 (과거→오늘 순) — Large 주간 스트립
  weeklyDone: z.array(z.boolean()).length(7),
  // 이 값들이 며칠 기준인지 — 서버가 준 오늘(/me/streak의 today). 로그인 전 빈 값이면 null.
  // 위젯은 이 값이 null이면(로그인 전) 시작 전 화면을, 아니면 주간 라벨을 그날 기준으로 되돌린다
  capturedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (value) => new Date(`${value}T00:00:00Z`).toISOString().startsWith(value),
      { message: '달력에 없는 날짜예요' },
    )
    .nullable(),
});

// 홈 위젯 크기 — iOS small/medium, Android 2×2/4×2/4×4를 같은 말로 부른다
export const widgetFamilySchema = z.enum(['small', 'medium', 'large']);
// 홈 화면에 위젯이 실제로 놓였는가·치워졌는가 — Android 위젯 프로바이더 콜백에서 온다 (iOS는 콜백이 없어 못 보낸다)
export const widgetChangeSchema = z.enum(['added', 'removed']);

// 구독 플랜 — 페이월 카드·스토어 상품(monthly/yearly)·계측 속성이 같은 이름을 쓴다
export const subscriptionPlanSchema = z.enum(['monthly', 'yearly']);

// 스토어 오퍼링의 패키지 하나 — 셸이 RevenueCat 패키지를 웹이 그릴 수 있는 모양으로 옮긴 것.
// 셸은 거르지 않고 그대로 넘긴다. `plan`은 셸이 예약 식별자로 알아본 값이고(웹도 이걸 먼저 믿는다),
// `period`는 그러지 못한 패키지를 웹이 판정하는 데 쓴다 — 새 상품을 붙일 때 앱을 다시 내지 않으려는 것이다
export const offeringPackageSchema = z.object({
  // RevenueCat 패키지 identifier (예: $rc_monthly). PURCHASE가 이 값을 되돌려 보낸다
  id: z.string().min(1),
  // 셸이 예약 식별자($rc_monthly·$rc_annual)로 알아본 플랜. 커스텀 이름이면 null이고 웹이 period로 정한다
  plan: subscriptionPlanSchema.nullable().default(null),
  // 숫자 가격과 통화(ISO 4217) — 웹은 KRW일 때만 이 숫자로 카드를 다시 계산한다
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  // 구독 주기 ISO 8601 원문(P1M·P1Y…). 이 필드를 보내지 않는 구버전 셸이 있어 없을 수 있다
  period: z.string().nullable().default(null),
});

// 결제 결과 — 사용자가 시트를 닫은 취소는 실패가 아니다. 복원엔 취소가 없다
export const purchaseStatusSchema = z.enum(['success', 'cancelled', 'error']);
export const restoreStatusSchema = z.enum(['success', 'error']);

// 사진 고르기 결과 — 사용자가 선택창을 닫은 취소는 실패가 아니다
export const photoPickStatusSchema = z.enum(['success', 'cancelled', 'error']);

// 셸이 고른 사진 한 장 — 셸이 긴 변을 줄여 JPEG로 다시 구운 base64다(메시지는 문자열만 오간다)
export const pickedPhotoSchema = z.object({
  base64: z.string().min(1),
  mimeType: z.literal('image/jpeg'),
});

// 한 번에 고를 수 있는 사진 수 상한 — 피드백 첨부 서버 제한(3장)과 같다
export const MAX_PICK_PHOTOS = 3;

// 반복 알람의 종류 — 종류마다 알람은 하나다. 새 알람(스몰톡·표현 학습 등)이 생기면 여기에 값을 더한다(메시지 모양은 그대로)
export const alarmTypeSchema = z.enum(['scenario']);

// 알람 시각 — 기기 현지 시각
export const alarmTimeSchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

// 요일 — 1(월)~7(일)
const weekdaySchema = z.number().int().min(1).max(7);

// 이 요일들에 이 시각에 울린다 — 매일 같은 시각이면 7요일짜리 하나, 요일마다 시각이 다르면 여러 개
export const alarmSlotSchema = alarmTimeSchema.extend({
  weekdays: z.array(weekdaySchema).min(1),
});

// 한 요일이 두 칸에 들어 있으면 그날 두 번 울린다 — 칸끼리 요일이 겹치면 받지 않는다
const alarmSlotsSchema = z
  .array(alarmSlotSchema)
  .min(1)
  .refine((slots) => {
    const days = slots.flatMap((slot) => slot.weekdays);
    return new Set(days).size === days.length;
  }, '요일이 겹친다');

// SET_ALARM이 싣는 반복 알람 — 언제 울릴지(slots)와 잠금화면 제목
export const repeatingAlarmSchema = z.object({
  title: z.string().min(1),
  slots: alarmSlotsSchema,
  // 오늘 회차는 빼고 건다 — 걸고 나서 건너뛰면 그 사이 틈이 생긴다
  skipToday: z.boolean().optional(),
  // 소리 없이 화면으로만 울린다 — 소리를 원치 않는 사람을 위한 설정 자리(아직 화면에 안 드러냄)
  silent: z.boolean().optional(),
});

// 셸에 걸려 있는 반복 알람 하나 — ALARM_STATUS가 종류별로 싣는다
export const repeatingAlarmStateSchema = z.object({
  alarmType: alarmTypeSchema,
  slots: z.array(alarmSlotSchema),
  // 오늘 회차를 건너뛴 날(기기 현지 "YYYY-MM-DD") — 건너뛴 적 없거나 날이 지나 되돌렸으면 null
  skipDate: z.string().nullable(),
});

// 셸이 띄울 수 있는 알람 설정 화면 — Android 14+에서 사용자가 직접 켜야 하는 두 권한
export const alarmSettingsTargetSchema = z.enum(['exactAlarm', 'fullScreen']);

// 셸에 걸린 알람 하나 — 개발자 화면이 목록으로 보여 준다
export const scheduledAlarmSchema = z.object({
  id: z.string(),
  // 반복 알람의 종류. 테스트 알람은 null
  alarmType: alarmTypeSchema.nullable(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  // 울리는 요일. 1회 알람이면 빈 배열
  weekdays: z.array(weekdaySchema),
  // 다음 울림(ms). 이미 울린 1회 알람이면 null
  nextAt: z.number().nullable(),
  skipDate: z.string().nullable(),
});

// 알람 권한과 셸에 실제로 걸린 반복 알람 — 알람 메시지는 전부 이걸로 답한다.
// supported=false는 알람을 못 쓰는 기기(iOS 25 이하)다. iOS의 exactAlarm은 AlarmKit 권한을 받았는지와 같고, fullScreen은 늘 true다
export const alarmStatusSchema = z.object({
  supported: z.boolean(),
  permission: notificationPermissionStatusSchema,
  exactAlarm: z.boolean(),
  fullScreen: z.boolean(),
  // 알림을 보낼 수 있는가 — Android는 꺼져 있으면 알람이 화면도 알림도 없이 소리만 나서 셸이 걸지 않는다. iOS는 늘 true
  notifications: z.boolean(),
  repeatingAlarms: z.array(repeatingAlarmStateSchema),
});

// 로그인 전·로그아웃 후에 쓰는 빈 값 — 웹이 이걸 보내 셸에 남은 이전 사용자 기록을 지운다.
// 완료 이력이 없으므로(null) 위젯은 몰락 연출 없이 0일 시간표만 그린다
export const EMPTY_WIDGET_DATA = {
  streak: 0,
  todayDone: false,
  lastCompletedDate: null,
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
  // 웹이 준비됐으니 쌓아 둔 위젯 추가·삭제를 보내 달라 — 응답은 WIDGET_CHANGED (건별, 없으면 무응답)
  z.object({ type: z.literal('REQUEST_WIDGET_CHANGES') }),
  // 로그인한 사용자를 RevenueCat에 알린다(Purchases.logIn). null이면 로그아웃(logOut). 단방향
  z.object({
    type: z.literal('IDENTIFY'),
    userId: z.string().min(1).nullable(),
  }),
  // 현재 오퍼링의 패키지(상품·가격)를 달라 — 응답은 OFFERINGS
  z.object({ type: z.literal('GET_OFFERINGS') }),
  // 패키지 하나를 결제한다 — 스토어 결제 시트가 뜬다. 응답은 PURCHASE_RESULT
  z.object({
    type: z.literal('PURCHASE'),
    packageId: z.string().min(1),
  }),
  // 이전 구매를 복원한다 — 응답은 RESTORE_RESULT
  z.object({ type: z.literal('RESTORE_PURCHASES') }),
  // OS 공유 시트를 연다 — 링크까지 담은 문구 한 덩어리. 안드로이드 공유는 url 칸이 없어 문구에 합쳐 보낸다 (단방향)
  z.object({
    type: z.literal('SHARE'),
    message: z.string().min(1),
  }),
  // 사진 보관함에서 사진을 고른다 — 카메라 없이 보관함만 연다. limit은 이번에 더 담을 수 있는 장수. 응답은 PHOTOS_PICKED
  z.object({
    type: z.literal('PICK_PHOTOS'),
    limit: z.number().int().min(1).max(MAX_PICK_PHOTOS),
  }),
  // 알람 권한·예약 상태 조회 — 다이얼로그를 띄우지 않는다. 응답은 ALARM_STATUS
  z.object({ type: z.literal('GET_ALARM_STATUS') }),
  // 알람 권한 요청 — iOS는 AlarmKit 권한창, Android는 정확한 알람 설정 화면이 뜬다. 응답은 ALARM_STATUS
  z.object({ type: z.literal('REQUEST_ALARM_PERMISSION') }),
  // Android 알람 권한 설정 화면을 연다 (단방향 — 돌아오면 웹이 GET_ALARM_STATUS로 다시 묻는다)
  z.object({
    type: z.literal('OPEN_ALARM_SETTINGS'),
    target: alarmSettingsTargetSchema,
  }),
  // 이 종류의 반복 알람을 다시 건다 — 같은 종류의 기존 예약만 지운다. null이면 끈다. 응답은 ALARM_STATUS
  z.object({
    type: z.literal('SET_ALARM'),
    alarmType: alarmTypeSchema,
    alarm: repeatingAlarmSchema.nullable(),
  }),
  // 이 종류의 반복 알람을 오늘만 울리지 않게 한다(내일부터 그대로). 응답은 ALARM_STATUS
  z.object({ type: z.literal('SKIP_ALARM_TODAY'), alarmType: alarmTypeSchema }),
  // 개발자 화면용 — 셸에 걸린 알람 전부를 묻는다. 응답은 ALARM_LIST
  z.object({ type: z.literal('GET_ALARM_LIST') }),
  // 개발자 섹션용 — 지금부터 delaySeconds 뒤에 한 번 울린다. 실제 예약은 건드리지 않는다. 응답은 ALARM_STATUS
  z.object({
    type: z.literal('TEST_ALARM'),
    delaySeconds: z.number().int().min(5).max(600),
    title: z.string().min(1),
    silent: z.boolean().optional(),
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
  // 앱이 떠 있는 상태에서 알림·위젯을 탭했을 때 — 웹 라우터가 이 경로로 이동한다
  z.object({
    type: z.literal('NAVIGATE'),
    url: z.string().min(1),
  }),
  // 홈 화면에 위젯이 놓이거나 치워졌다 — 웹이 계측한다. 셸이 쌓아 뒀다가 웹이 청하면(REQUEST_WIDGET_CHANGES) 건별로 보낸다
  z.object({
    type: z.literal('WIDGET_CHANGED'),
    change: widgetChangeSchema,
    family: widgetFamilySchema,
  }),
  // GET_OFFERINGS 응답 — 셸이 스토어에서 받은 패키지 목록. 오퍼링이 비어 있으면 빈 배열
  z.object({
    type: z.literal('OFFERINGS'),
    packages: z.array(offeringPackageSchema),
  }),
  // PURCHASE 응답 — error일 때만 message가 실린다(사용자에게 보여줄 수 있는 문구)
  z.object({
    type: z.literal('PURCHASE_RESULT'),
    status: purchaseStatusSchema,
    message: z.string().optional(),
  }),
  // RESTORE_PURCHASES 응답
  z.object({
    type: z.literal('RESTORE_RESULT'),
    status: restoreStatusSchema,
    message: z.string().optional(),
  }),
  // PICK_PHOTOS 응답 — success일 때만 photos가 차 있다. 셸이 못 구운 사진은 빼고 보낸다.
  // failedCount·overflowed는 웹이 사용자에게 무엇이 빠졌는지 알리는 데 쓴다
  z.object({
    type: z.literal('PHOTOS_PICKED'),
    status: photoPickStatusSchema,
    photos: z.array(pickedPhotoSchema).max(MAX_PICK_PHOTOS),
    // 골랐지만 못 구워 뺀 장수
    failedCount: z.number().int().min(0),
    // limit보다 많이 골라 뒤를 잘랐는가 — 선택창이 장수를 막지 못하는 구형 Android 대비
    overflowed: z.boolean(),
  }),
  // GET_ALARM_STATUS·REQUEST_ALARM_PERMISSION·SET_ALARM·SKIP_ALARM_TODAY·TEST_ALARM 응답 — 지금 권한과 셸에 실제로 걸린 반복 알람
  alarmStatusSchema.extend({ type: z.literal('ALARM_STATUS') }),
  // GET_ALARM_LIST 응답 — 반복·테스트 알람 전부
  z.object({
    type: z.literal('ALARM_LIST'),
    alarms: z.array(scheduledAlarmSchema),
  }),
]);

// 위 스키마에서 자동으로 뽑아낸 타입 — 스키마를 고치면 타입도 같이 바뀐다
export type HapticPattern = z.infer<typeof hapticPatternSchema>;
export type WidgetData = z.infer<typeof widgetDataSchema>;
export type WidgetFamily = z.infer<typeof widgetFamilySchema>;
export type WidgetChange = z.infer<typeof widgetChangeSchema>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type OfferingPackage = z.infer<typeof offeringPackageSchema>;
export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>;
export type RestoreStatus = z.infer<typeof restoreStatusSchema>;
export type PhotoPickStatus = z.infer<typeof photoPickStatusSchema>;
export type PickedPhoto = z.infer<typeof pickedPhotoSchema>;
export type AlarmType = z.infer<typeof alarmTypeSchema>;
export type AlarmTime = z.infer<typeof alarmTimeSchema>;
export type AlarmSlot = z.infer<typeof alarmSlotSchema>;
export type RepeatingAlarm = z.infer<typeof repeatingAlarmSchema>;
export type RepeatingAlarmState = z.infer<typeof repeatingAlarmStateSchema>;
export type AlarmSettingsTarget = z.infer<typeof alarmSettingsTargetSchema>;
export type AlarmStatus = z.infer<typeof alarmStatusSchema>;
export type ScheduledAlarm = z.infer<typeof scheduledAlarmSchema>;
export type NotificationPermissionStatus = z.infer<
  typeof notificationPermissionStatusSchema
>;
export type WebToNativeMessage = z.infer<typeof webToNativeMessageSchema>;
export type NativeToWebMessage = z.infer<typeof nativeToWebMessageSchema>;
