# Sentry 에러 모니터링

웹(apps/web)의 예외 수집 규칙. 앰플리튜드([analytics.md](analytics.md))가 "유저가 뭘 했나"를 보면, Sentry는 "어디서 터졌나"를 본다.

모바일(WebView 셸)은 별도 프로젝트로 본다 — 제품 로직이 전부 웹이라 앱 안에서 나는 웹 에러는 웹 Sentry가 `surface: app` 태그로 잡고, 셸 Sentry(`@sentry/react-native`, LAN-472)는 네이티브 크래시와 셸이 `catch`로 삼키는 실패(결제·로그인·브릿지·위젯·알림·웹뷰 프로세스 종료)를 본다. 셸의 보고 통로는 [apps/mobile/src/monitoring/report.ts](../apps/mobile/src/monitoring/report.ts)로 웹과 같은 모양이다.

## 원칙

- **도메인 코드는 Sentry를 직접 부르지 않는다.** 수동 보고는 전부 [shared/monitoring/report.ts](../apps/web/src/shared/monitoring/report.ts)의 두 함수로 — analytics의 `track()`과 같은 단일 통로 패턴. `@sentry/nextjs` 직접 import는 instrumentation·config 파일에만 허용된다.
  - 레벨 의미는 **표준 로깅 관례(syslog·log4j)** 를 따른다. Sentry는 레벨 목록만 주고 의미는 정하지 않는다 — 공식 문서의 설명은 "로깅 레벨과 비슷하다"가 전부다.
  - `reportError(error)` — **연산이 실패로 끝났다.** 유저 데이터가 유실되거나 진행이 막히는 실패 (세션 시작·발화 제출·피드백 전송). catch로 처리돼 Sentry 자동 그물(미처리 예외)에 안 걸리므로 명시 호출이 필요하다.
  - `reportWarning(failure, extra?)` — **비정상이지만 감내하고 계속한다(degraded).** 폴백으로 흐름이 이어지거나 유저가 이미 화면을 떠난 실패 (STT 인식·TTS 합성/재생·속마음 폴백·세션 종료). 백엔드가 같은 org에 있어 장애 상관관계를 엮는 단서가 된다.
- **유저의 선택은 보고하지 않는다.** 마이크 권한 거부, 빈 발화(아무 말 안 함) 같은 건 결함이 아니다 — 앰플리튜드 몫.
- **트레이싱은 켜지 않고, 리플레이는 에러 세션만.** 상시 리플레이는 앰플리튜드가 100% 수집 중이라 중복 — Sentry는 `replaysOnErrorSampleRate: 1.0`으로 에러가 난 순간의 직전 구간(최대 60초 버퍼)만 이슈에 첨부한다(평소엔 버퍼만, 전송 없음). warning 이벤트에도 첨부된다 — 저하 실패는 드물어 쿼터 부담이 작고, 문제 되면 그때 `beforeErrorSampling`으로 제한한다. 무료 쿼터(월 50개)를 넘으면 조용히 안 담길 뿐이다. 텍스트는 기본 마스킹(maskAllText) 그대로 둔다 — 발화 원문 보호.
- **DSN이 없으면 SDK가 조용히 꺼진다.** 로컬 개발이 기본적으로 프로젝트를 오염시키지 않는 이유. 로컬에서 전송을 테스트하고 싶을 때만 env에 DSN을 넣는다.
- **로그인 사용자는 유저 id로만 묶는다.** [shared/monitoring/MonitoringBootstrap.tsx](../apps/web/src/shared/monitoring/MonitoringBootstrap.tsx)가 auth store의 member를 보고 `setMonitoringUser`로 `user.id`(우리 유저 id 문자열)를 붙이고 로그아웃하면 푼다. 셸의 `IDENTIFY`·RevenueCat app_user_id와 같은 값이라 세 곳을 한 id로 좇는다. 이메일·닉네임은 보내지 않는다 (개인정보처리방침의 Sentry 위탁 여부 미확인).
- **알림 규칙은 코드가 아니라 Sentry 대시보드에 있다.** 레벨은 심각도만 표시하고, 그걸로 언제 부를지는 대시보드에서 따로 정한다.

## 수집 경로

| 상황                                | 레벨    | 잡는 곳                                                                                               | 유저가 보는 것                              |
| ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 웹 페이지 렌더 중 예외              | error   | [apps/web/src/app/error.tsx](../apps/web/src/app/error.tsx)                                           | 우는 뱁새 + "다시 시도할게요"               |
| 루트 레이아웃까지 죽음              | error   | [apps/web/src/app/global-error.tsx](../apps/web/src/app/global-error.tsx) (인라인 스타일 최후 방어선) | 같은 화면                                   |
| 이벤트 핸들러·비동기 예외           | error   | SDK 자동 (unhandled error/rejection)                                                                  | 화면 변화 없음                              |
| 서버 라우트(RSC·route handler) 예외 | error   | [apps/web/src/instrumentation.ts](../apps/web/src/instrumentation.ts) `onRequestError`                | —                                           |
| 대화 세션 시작 실패                 | error   | useConversationSession (reportError)                                                                  | 제출 시 토스트                              |
| 발화 제출 실패                      | error   | useConversationFlow (reportError)                                                                     | 토스트 + 재시도                             |
| 피드백 전송 실패                    | error   | FeedbackComposeFlow (reportError)                                                                     | 토스트로 재시도 안내 (유실되므로 보고 필수) |
| STT 인식 오류 (권한 거부 제외)      | warning | useConversationInput (reportWarning)                                                                  | 토스트                                      |
| TTS 합성·재생 실패                  | warning | useTts (reportWarning)                                                                                | 타이머 폴백으로 대화 계속                   |
| 속마음 생성 실패·시간초과           | warning | useInnerThought (reportWarning)                                                                       | 속마음 생략하고 다음 턴                     |
| 대화 세션 종료(중도 이탈) 실패      | warning | useConversationSession (reportWarning)                                                                | 없음 — 유저는 이미 나감                     |

### 셸(모바일)

| 상황                                                    | 레벨    | 잡는 곳                                                          | 유저가 보는 것                  |
| ------------------------------------------------------- | ------- | ---------------------------------------------------------------- | ------------------------------- |
| 네이티브 크래시·JS 미처리 예외                          | error   | SDK 자동 (`_layout.tsx`의 `Sentry.init` + `Sentry.wrap`)         | 앱 종료 또는 재시작             |
| 결제·복원 실패, 오퍼링에 없는 패키지 (사용자 취소 제외) | error   | purchases.ts (reportError, `packageId` 첨부)                     | 페이월 실패 문구                |
| 브릿지 핸들러 예외                                      | error   | useNativeBridge.ts (reportError, `messageType` 첨부)             | 웹이 회신을 못 받고 멈춤        |
| 소셜 로그인 실패 (사용자 취소 제외)                     | error   | socialLogin/shared/failure.ts (reportError, `provider` 첨부)     | 로그인 화면 에러 배너           |
| 스토어 오퍼링 조회 실패                                 | warning | purchases.ts (reportWarning)                                     | 등록값 가격 표시로 계속         |
| 웹뷰 프로세스 종료 (흰 화면)                            | warning | index.tsx `onContentProcessDidTerminate` / `onRenderProcessGone` | 다시 마운트, 반복되면 실패 화면 |
| 푸시 토큰 발급 실패·projectId 누락                      | warning | push-token.ts (reportWarning)                                    | 없음 — 다음 실행에 다시 시도    |
| 알림·위젯 콜드 스타트 경로 조회 실패                    | warning | useNotificationDeepLink.ts / useWidgetEntry.ts (reportWarning)   | 홈으로 열린다                   |
| 위젯 갱신·핀·아트 복사·설치 목록 실패                   | warning | widgets/android/\*.ts, widgets/ios/sync.ts, widget-inventory.ts  | 위젯이 낡은 채로 남는다         |
| 위젯 저장값 깨짐 (JSON 아님·규격 불일치)                | warning | widget-store.ts / widget-inventory.ts                            | 기본 화면으로 그린다            |

보고하지 않는 것 — 사용자 취소(결제 시트 닫기, 로그인 취소), 결제 키가 없는 로컬 빌드, URL 파싱 실패(외부 이동 판정, 네이티브 인텐트)처럼 결함이 아닌 입력.

셸은 `IDENTIFY` 브릿지 메시지의 userId를 Sentry 사용자로 붙인다 — RevenueCat app_user_id와 같은 값이라 결제 웹훅 미매칭 건을 사용자 단위로 좇을 수 있다.

## 프로젝트·환경 구조

Sentry org는 백엔드와 같은 `saynow`. 기존 `{도메인}-{환경}` 컨벤션을 따른다.

| 프로젝트      | 대상                             | DSN이 사는 곳                                     |
| ------------- | -------------------------------- | ------------------------------------------------- |
| `web-develop` | 웹 dev 배포·로컬 테스트          | Vercel Preview/Dev env, 필요 시 로컬 `.env.local` |
| `web-prod`    | 웹 프로덕션                      | Vercel Production env                             |
| `mobile-dev`  | 셸 preview 빌드·로컬 전송 테스트 | EAS preview 환경변수, 필요 시 로컬 `.env`         |
| `mobile-prod` | 셸 스토어 빌드                   | EAS production 환경변수 `EXPO_PUBLIC_SENTRY_DSN`  |

셸의 `environment` 태그는 `__DEV__`로 정해져 preview 빌드도 production으로 찍힌다 — 그래서 dev 백엔드를 보는 preview 빌드는 프로젝트를 나눠 prod 이슈와 섞이지 않게 한다. 로컬 dev 빌드는 DSN이 비어 SDK가 꺼진다.

## 환경변수

| 변수                                                  | 위치                                                                             | 용도                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SENTRY_DSN`                              | Vercel 환경별로 다른 프로젝트 DSN                                                | 전송 대상. 없으면 SDK off                                          |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | 웹: Vercel Production. **auth token은 비밀 — 클라이언트 노출 금지**              | 소스맵 업로드. 없으면 업로드만 스킵되고 빌드는 정상                |
| `EXPO_PUBLIC_SENTRY_DSN` / `SENTRY_PROJECT`           | 셸: EAS preview·production 환경변수 (preview=mobile-dev, production=mobile-prod) | 전송 대상과 소스맵 업로드 대상. 둘이 같은 프로젝트를 가리켜야 한다 |
| `SENTRY_AUTH_TOKEN`                                   | 셸: EAS preview·production 시크릿                                                | 소스맵·dSYM 업로드. **없으면 릴리즈 빌드가 실패한다**              |

DSN은 public key라 번들에 노출돼도 된다(전송만 가능, 조회 불가). 그래서 `NEXT_PUBLIC_` 접두사를 쓴다.

셸은 `EXPO_PUBLIC_SENTRY_DSN`과 `SENTRY_PROJECT`(둘 다 EAS 환경변수, 프로필별로 짝을 맞춘다)와 `SENTRY_AUTH_TOKEN`(EAS 시크릿)을 쓴다. org는 `app.json`의 `@sentry/react-native/expo` 플러그인에, project는 DSN과 어긋나지 않게 env에 둔다. 소스맵·dSYM은 릴리즈 빌드에서 플러그인이 올린다. **웹과 달리 토큰이 없으면 릴리즈 빌드가 실패한다** — EAS preview·production 환경에는 `SENTRY_AUTH_TOKEN`이 반드시 있어야 하고, 토큰 없이 맥에서 릴리즈 빌드를 돌릴 땐 `SENTRY_DISABLE_AUTO_UPLOAD=true`를 앞에 붙인다. OTA(EAS Update)로 JS만 내보낼 땐 `npx sentry-expo-upload-sourcemaps dist`를 따로 돌려야 스택이 맞는다.

## 태그

웹 클라이언트는 셸 주입 컨텍스트(`window.__LANDIT_NATIVE__`, LAN-156)로 태그를 단다. 이름은 앰플리튜드 공통 속성([analytics.md](analytics.md))과 같은 어휘를 쓴다 — 두 대시보드를 오갈 때 같은 단어로 필터하려고.

- `surface`: `app`(웹뷰) | `browser` — 흰 화면류는 전부 app에서만 난다. 이슈 필터의 시작점
- `platform`: `ios` | `android` | `web`
- `app_version`: 셸 앱 버전 (앱일 때만)
- `build_number`: 스토어 빌드 번호 (앱이고 값이 있을 때만)
- `environment`: `development` | `production`

웹 배포 버전은 태그로 달지 않는다 — Sentry가 커밋 SHA를 `release`로 자동으로 붙인다 (앰플리튜드의 `web_version`에 대응).

## 로컬에서 전송 테스트하기

1. `apps/web/.env.local`에 `NEXT_PUBLIC_SENTRY_DSN=` (web-develop 프로젝트 DSN)
2. dev 서버 재시작 후 아무 페이지에서 예외를 던지면 대시보드 Issues에 뜬다
3. 끝나면 DSN을 지워 다시 끈다 (dev 이슈 오염 방지)
