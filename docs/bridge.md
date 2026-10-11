# 웹 ↔ 네이티브 브릿지

landit 앱은 네이티브 UI 없이 웹(Next.js)을 WebView로 감싸는 셸이다. 네이티브 JS와 웹 JS는 서로 격리되어 있어 직접 접근할 수 없고, 유일한 통로는 문자열만 오가는 postMessage 채널이다. 이 채널 위에서 타입 안전하게 통신하는 계층이 브릿지다.

## 용어

| 용어              | 뜻                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------- |
| **웹**            | `apps/web`의 Next.js 앱. 제품 화면 전부가 여기 있다                                    |
| **앱 (네이티브)** | `apps/mobile`의 React Native 앱. OS 기능(뒤로가기, 마이크 등)을 담당한다               |
| **WebView**       | 앱 안에 내장된 브라우저. 앱은 이 안에 웹을 띄운다                                      |
| **일반 브라우저** | Chrome·Safari에서 웹을 직접 열었을 때. 앱이 없으므로 브릿지도 없다 (개발 중이 이 상태) |

## 파일 구조

| 위치              | 파일                                 | 역할                                                                      |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| `packages/bridge` | `src/messages.ts`                    | 메시지 카탈로그. zod 스키마로 규격을 선언하고 타입을 유도한다             |
| `packages/bridge` | `src/serialization.ts`               | 문자열↔객체 변환. 파싱은 zod 검증을 거쳐 규격 밖 값을 버린다              |
| `apps/web`        | `src/bridge/webBridge.ts`            | 웹 쪽 끝단. `postToNative`(발신) / `subscribeFromNative`(수신 구독)       |
| `apps/web`        | `src/components/bridge-listener.tsx` | 전역 리스너. 루트 레이아웃에 마운트되어 뒤로가기 등 화면 무관 메시지 처리 |
| `apps/mobile`     | `src/bridge/useNativeBridge.ts`      | 네이티브 쪽 끝단. `onMessage`(수신 분배) / `postToWeb`(발신)              |
| `apps/mobile`     | `src/app/index.tsx`                  | WebView 셸 화면. 핸들러 등록과 뒤로가기 위임                              |

메시지 규격은 `packages/bridge` 한 곳에만 있다. web/mobile이 같은 스키마를 import하므로 한쪽만 고쳐서 어긋나는 사고가 구조적으로 안 난다.

## 메시지 카탈로그

| 메시지                            | 방향  | 페이로드                                        | 역할                                                                                                                                  | 처리 위치                |
| --------------------------------- | ----- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `BACK_PRESSED`                    | 앱→웹 | 없음                                            | Android 뒤로가기가 눌렸음을 알림. 판단은 웹이 한다                                                                                    | `bridge-listener.tsx`    |
| `EXIT_APP`                        | 웹→앱 | 없음                                            | 웹이 "더 뒤로 갈 곳 없음"을 판단했을 때 앱 종료 요청                                                                                  | `index.tsx`의 핸들러     |
| `HAPTIC`                          | 웹→앱 | `pattern`                                       | 웹 인터랙션 시점의 진동 요청. 세기·종류는 앱이 expo-haptics로 결정                                                                    | `index.tsx`의 핸들러     |
| `GET_NOTIFICATION_PERMISSION`     | 웹→앱 | 없음                                            | 알림 권한 상태 조회 (다이얼로그 없음). 응답은 `NOTIFICATION_PERMISSION`                                                               | `index.tsx`의 핸들러     |
| `REQUEST_NOTIFICATION_PERMISSION` | 웹→앱 | 없음                                            | 알림 권한 능동 요청 — OS 권한창을 띄울 수 있다. 응답은 `NOTIFICATION_PERMISSION`                                                      | `index.tsx`의 핸들러     |
| `NOTIFICATION_PERMISSION`         | 앱→웹 | `status`                                        | 권한 조회·요청에 대한 응답 (`granted`/`denied`/`undetermined`)                                                                        | 알림 기능 훅 (LAN-189)   |
| `PUSH_TOKEN`                      | 앱→웹 | `token`                                         | 셸이 발급받은 푸시 토큰 전달. 웹이 설치 ID·OS 권한과 함께 설치 API로 동기화한다                                                       | 알림 기능 훅 (LAN-189)   |
| `NAVIGATE`                        | 앱→웹 | `url`                                           | 앱이 떠 있는 상태에서 알림·위젯을 탭했을 때 웹에 화면 이동을 요청한다                                                                 | `BridgeListener.tsx`     |
| `REQUEST_WIDGET_CHANGES`          | 웹→앱 | 없음                                            | 웹이 떴으니 쌓아 둔 위젯 추가·삭제를 보내 달라. 응답은 `WIDGET_CHANGED` 건별 (없으면 무응답)                                          | `index.tsx`의 핸들러     |
| `WIDGET_CHANGED`                  | 앱→웹 | `change`, `family`                              | 홈 화면에 위젯이 놓였다(`added`)·치워졌다(`removed`)와 크기. 웹이 앰플리튜드에 남긴다                                                 | `WidgetChangeSync.tsx`   |
| `IDENTIFY`                        | 웹→앱 | `userId` (null 가능)                            | 로그인 사용자를 RevenueCat에 알린다(`logIn`). null이면 로그아웃(`logOut`). 단방향                                                     | `index.tsx`의 핸들러     |
| `GET_OFFERINGS`                   | 웹→앱 | 없음                                            | 스토어 오퍼링의 패키지(상품·가격) 조회. 응답은 `OFFERINGS`                                                                            | `index.tsx`의 핸들러     |
| `PURCHASE`                        | 웹→앱 | `packageId`                                     | 패키지 결제 — 스토어 결제 시트가 뜬다. 응답은 `PURCHASE_RESULT`                                                                       | `index.tsx`의 핸들러     |
| `RESTORE_PURCHASES`               | 웹→앱 | 없음                                            | 이전 구매 복원. 응답은 `RESTORE_RESULT`                                                                                               | `index.tsx`의 핸들러     |
| `SHARE`                           | 웹→앱 | `message`                                       | OS 공유 시트를 연다. 링크까지 담은 문구 한 덩어리(안드로이드 공유엔 url 칸이 없다). 단방향                                            | `index.tsx`의 핸들러     |
| `OFFERINGS`                       | 앱→웹 | `packages`                                      | 패키지 목록(`id`, `plan`, `price`, `currency`). `plan`은 셸이 packageType으로 판단해 붙인다                                           | 구독 기능 훅 (LAN-447)   |
| `PURCHASE_RESULT`                 | 앱→웹 | `status`, `message?`                            | `success`/`cancelled`/`error`. 취소는 실패가 아니라 조용히 끝낸다                                                                     | 구독 기능 훅 (LAN-447)   |
| `RESTORE_RESULT`                  | 앱→웹 | `status`, `message?`                            | `success`/`error`                                                                                                                     | 구독 기능 훅 (LAN-447)   |
| `PICK_PHOTOS`                     | 웹→앱 | `limit` (1~3)                                   | 사진 보관함만 연다(카메라 없음). 응답은 `PHOTOS_PICKED`                                                                               | `index.tsx`의 핸들러     |
| `PHOTOS_PICKED`                   | 앱→웹 | `status`, `photos`, `failedCount`, `overflowed` | `success`/`cancelled`/`error`. `photos`는 셸이 장당 1.5MB 안으로 줄인 JPEG base64. 못 구운 장수와 한도 초과 여부를 실어 웹이 안내한다 | 편지함 첨부 훅 (LAN-595) |
| `GET_ALARM_STATUS`                | 웹→앱 | 없음                                            | 알람 권한·걸린 매일 알람 조회 (다이얼로그 없음). 응답은 `ALARM_STATUS`                                                                | `index.tsx`의 핸들러     |
| `REQUEST_ALARM_PERMISSION`        | 웹→앱 | 없음                                            | 알람 권한 요청 — iOS는 AlarmKit 권한창, Android는 정확한 알람 설정 화면. 응답은 `ALARM_STATUS`                                        | `index.tsx`의 핸들러     |
| `OPEN_ALARM_SETTINGS`             | 웹→앱 | `target`                                        | Android 설정 화면(정확한 알람·전체 화면 알림)을 연다. 단방향 — 돌아오면 웹이 다시 묻는다                                              | `index.tsx`의 핸들러     |
| `SET_ALARM`                       | 웹→앱 | `alarmType`, `alarm` (null이면 끄기)            | 그 종류의 반복 알람만 지우고 다시 건다. 눌렀을 때 갈 화면은 `path`. 응답은 `ALARM_STATUS`                                             | `index.tsx`의 핸들러     |
| `SKIP_ALARM_TODAY`                | 웹→앱 | `alarmType`                                     | 그 종류의 반복 알람을 오늘만 울리지 않게 한다(내일부터 그대로). 응답은 `ALARM_STATUS`                                                 | `index.tsx`의 핸들러     |
| `TEST_ALARM`                      | 웹→앱 | `delaySeconds`, `title`, `silent?`              | 개발자 화면용 1회 알람(5초~10분 뒤). 반복 알람은 건드리지 않는다. 응답은 `ALARM_STATUS`                                               | `index.tsx`의 핸들러     |
| `GET_ALARM_LIST`                  | 웹→앱 | 없음                                            | 개발자 화면용 — 셸에 걸린 알람 전부 조회. 응답은 `ALARM_LIST`                                                                         | `index.tsx`의 핸들러     |
| `CANCEL_ALARM`                    | 웹→앱 | `id`                                            | 개발자 화면용 — 걸린 알람 하나를 id로 지운다(테스트·반복 모두). 응답은 `ALARM_LIST`                                                   | `index.tsx`의 핸들러     |
| `ALARM_STATUS`                    | 앱→웹 | 권한 5칸, `repeatingAlarms`                     | 알람 요청들의 공통 응답 — 권한과 종류별 반복 알람(스케줄·화면·건너뛴 날)                                                              | 알람 기능 (LAN-461)      |
| `ALARM_LIST`                      | 앱→웹 | `alarms`                                        | `GET_ALARM_LIST` 응답 — 종류(테스트는 null)·시각·요일·다음 울림·건너뛴 날                                                             | 알람 점검 (LAN-461)      |
| `ALARM_OPENED`                    | 앱→웹 | `alarmType`, `path`                             | 앱이 떠 있을 때 알람의 "대화하러 가기" — 웹이 지금 화면을 보고 `path`로 갈지 정한다(학습 중이면 그대로)                               | 알람 기능 (LAN-461)      |

STT·TTS·인증 등 기능 메시지는 각 기능 이슈에서 추가한다.

## 통신 방법

웹 → 앱.

```
postToNative({ type: 'EXIT_APP' })
  → JSON 직렬화 → window.ReactNativeWebView.postMessage(문자열)
  → <WebView onMessage>로 도착 → zod 검증(실패 시 폐기) → type에 맞는 핸들러 실행
```

앱 → 웹.

```
postToWeb({ type: 'BACK_PRESSED' })
  → webviewRef.postMessage(문자열) → 웹 페이지에 message 이벤트 발생
  → subscribeFromNative 리스너 → zod 검증(실패 시 폐기) → 콜백 실행
```

플랫폼 차이 하나 — 네이티브→웹 메시지가 iOS는 `window`에, Android는 `document`에 도착한다. 그래서 웹은 양쪽 모두에 리스너를 건다.

## 새 메시지 추가하는 법

예 — 햅틱 진동 요청(`HAPTIC`)을 추가한다면.

```ts
// 1. packages/bridge/src/messages.ts — 스키마에 한 줄
const webToNativeMessageSchema = z.discriminatedUnion('type', [
  // ...기존...
  z.object({
    type: z.literal('HAPTIC'),
    pattern: hapticPatternSchema, // selection/light/medium/heavy/success/warning/error
  }),
]);

// 2. apps/mobile — 핸들러 등록 (message 타입은 자동으로 좁혀져 있음)
useNativeBridge(webviewRef, {
  HAPTIC: ({ pattern }) => void runHaptic(pattern),
});

// 3. apps/web — 보낸다
postToNative({ type: 'HAPTIC', pattern: 'light' });
```

타입·검증·핸들러 슬롯이 스키마 한 줄에서 전부 파생되므로, 세 단계 외의 수정은 없다.

## 뒤로가기 설계

시스템 뒤로가기는 Android에만 있다. iOS는 `allowsBackForwardNavigationGestures`(화면 끝 스와이프)로 WebView가 자체 히스토리를 탐색하므로 브릿지를 안 거친다.

Android 흐름은 2단계다.

1. **네이티브** — 뒤로가기 버튼 이벤트를 받아 `BACK_PRESSED`를 웹으로 보낸다. 단, 웹이 로드 완료된 상태에서만. 로딩 중·에러 상태에 위임하면 웹이 응답할 수 없어 뒤로가기가 영구 먹통이 된다.
2. **웹** — `bridge-listener.tsx`가 `navigation.canGoBack`으로 판단한다. 뒤로 갈 수 있으면 `history.back()`, 첫 화면이면 `EXIT_APP`. `history.length`는 뒤로 가도 줄지 않아 판단 기준이 될 수 없다.

## 주의사항

- 문자열만 오간다. JSON으로 표현 가능한 데이터만 넘길 수 있다.
- 웹 페이지가 로딩 중일 때 앱이 보낸 메시지는 받는 쪽이 없어서 조용히 사라진다 (에러도 안 난다). 지금은 이런 메시지가 없지만, 앱이 먼저 보내는 메시지를 추가할 때는 웹 로드가 끝난 뒤에 보내도록 해야 한다.
- 일반 브라우저에서 `postToNative`는 아무 일도 하지 않는다(false 반환). 웹 코드는 브릿지 없이도 항상 동작해야 한다.
- 구버전 앱이 신버전 웹을 여는 상황은 항상 존재한다(앱은 스토어 심사를 기다린다). 모르는 메시지는 검증 단계에서 버려지므로 앱이 죽지는 않는다.
- zod 검증은 형식만 보장한다. 인증 토큰처럼 민감한 페이로드를 다루는 메시지는 추가하는 이슈에서 별도 검토가 필요하다.
