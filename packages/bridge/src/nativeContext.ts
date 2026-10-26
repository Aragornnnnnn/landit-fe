// 셸이 웹에 주입하는 네이티브 컨텍스트 스키마·직렬화 — 앱 버전·플랫폼을 웹 계측(앰플리튜드)에 전달한다
import { z } from 'zod';

// 브릿지 계약 버전 — 브릿지 메시지/컨텍스트 규격이 바뀌면 올린다. 웹이 구 셸 능력 판단에 쓴다.
// 3: REQUEST_WIDGET_PIN 추가 (위젯 설치 안내 노출 자체는 위젯이 실린 릴리즈 여부라 appVersion으로 게이트한다)
// 4: REQUEST_WIDGET_CHANGES / WIDGET_CHANGED 추가 (위젯 설치·삭제 계측)
// 5: IDENTIFY / GET_OFFERINGS / PURCHASE / RESTORE_PURCHASES ↔ OFFERINGS / PURCHASE_RESULT / RESTORE_RESULT (인앱 결제, LAN-447)
// 6: SHARE 추가 (친구에게 공유하기, LAN-578)
// 7: PICK_PHOTOS ↔ PHOTOS_PICKED (피드백 사진 첨부, 카메라 없이 사진 보관함만, LAN-595)
// 8: GET_ALARM_STATUS / REQUEST_ALARM_PERMISSION / OPEN_ALARM_SETTINGS / SET_ALARM / SKIP_ALARM_TODAY / TEST_ALARM / GET_ALARM_LIST / CANCEL_ALARM ↔ ALARM_STATUS / ALARM_LIST, ALARM_OPENED (오늘의 시나리오 알람, LAN-461)
// 9: REQUEST_REVIEW ↔ REVIEW_RESULT (앱 안 별점 카드, LAN-701)
// 10: 컨텍스트에 fontScale 추가, Android 글자 자동 확대(textZoom) 끔 (마이페이지 글자 크기)
// 11: 컨텍스트에 deviceId 추가 (친구 초대 같은 기기 판정용)
// 12: LOG_AD_EVENT 추가 (메타 광고 최적화용 앱 이벤트, LAN-768)
// 13: REQUEST_TRACKING_STATUS ↔ TRACKING_STATUS (iOS 광고 추적 허용 계측, LAN-769)
export const NATIVE_BRIDGE_VERSION = 13;

// 셸이 주입하고 웹이 읽는 전역 키
export const NATIVE_CONTEXT_GLOBAL = '__LANDIT_NATIVE__';

export const nativeContextSchema = z.object({
  platform: z.enum(['ios', 'android']),
  // app.json version — 예: "1.0.0"
  appVersion: z.string().min(1),
  // iOS buildNumber / Android versionCode. 스토어 빌드 번호가 없으면 null
  buildNumber: z.string().nullable(),
  bridgeVersion: z.number().int(),
  // 기기 글자 크기 배율(1 = 기본). 웹이 첫 글자 크기 단계를 정할 때 쓴다. 브릿지 9 이하 셸은 보내지 않는다
  fontScale: z.number().positive().optional(),
  // 다시 설치해도 유지되는 기기 ID(iOS 키체인 UUID·Android ANDROID_ID). 못 읽었거나 브릿지 10 이하 셸이면 없다
  deviceId: z.string().min(1).optional(),
});

export type NativeContext = z.infer<typeof nativeContextSchema>;

// 셸이 WebView injectedJavaScriptBeforeContentLoaded에 넣을 스크립트를 만든다.
// 콘텐츠 로드 전 동기 실행돼 전역을 세팅한다. 끝을 true;로 마감해 iOS의 injectedJS 반환값 경고를 막는다
export function buildNativeContextScript(context: NativeContext): string {
  return `window.${NATIVE_CONTEXT_GLOBAL} = ${JSON.stringify(context)}; true;`;
}

// 웹이 주입값(window.__LANDIT_NATIVE__)을 검증해 반환한다. 없거나(브라우저) 규격 밖이면 null
export function readNativeContext(raw: unknown): NativeContext | null {
  const result = nativeContextSchema.safeParse(raw);
  return result.success ? result.data : null;
}
