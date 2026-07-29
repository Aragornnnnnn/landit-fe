# Sentry 에러 모니터링

웹(apps/web)의 예외 수집 규칙. 앰플리튜드([analytics.md](analytics.md))가 "유저가 뭘 했나"를 보면, Sentry는 "어디서 터졌나"를 본다.

모바일(WebView 셸)에는 Sentry를 넣지 않는다 — 제품 로직이 전부 웹이라 앱 안에서 나는 에러도 웹 Sentry가 `surface: app` 태그로 잡는다. 셸 자체의 네이티브 크래시만 관측 밖이다.

## 원칙

- **도메인 코드는 Sentry를 직접 부르지 않는다.** 수동 보고는 전부 [shared/monitoring/report.ts](../apps/web/src/shared/monitoring/report.ts)의 두 함수로 — analytics의 `track()`과 같은 단일 통로 패턴. `@sentry/nextjs` 직접 import는 instrumentation·config 파일에만 허용된다.
  - 레벨 의미는 **표준 로깅 관례(syslog·log4j)** 를 따른다. Sentry는 레벨 목록만 주고 의미는 정하지 않는다 — 공식 문서의 설명은 "로깅 레벨과 비슷하다"가 전부다.
  - `reportError(error)` — **연산이 실패로 끝났다.** 유저 데이터가 유실되거나 진행이 막히는 실패 (세션 시작·발화 제출·NPS 제출). catch로 처리돼 Sentry 자동 그물(미처리 예외)에 안 걸리므로 명시 호출이 필요하다.
  - `reportWarning(failure, extra?)` — **비정상이지만 감내하고 계속한다(degraded).** 폴백으로 흐름이 이어지거나 유저가 이미 화면을 떠난 실패 (STT 인식·TTS 합성/재생·속마음 폴백·세션 종료). 백엔드가 같은 org에 있어 장애 상관관계를 엮는 단서가 된다.
- **유저의 선택은 보고하지 않는다.** 마이크 권한 거부, 빈 발화(아무 말 안 함) 같은 건 결함이 아니다 — 앰플리튜드 몫.
- **트레이싱은 켜지 않고, 리플레이는 에러 세션만.** 상시 리플레이는 앰플리튜드가 100% 수집 중이라 중복 — Sentry는 `replaysOnErrorSampleRate: 1.0`으로 에러가 난 순간의 직전 구간(최대 60초 버퍼)만 이슈에 첨부한다(평소엔 버퍼만, 전송 없음). warning 이벤트에도 첨부된다 — 저하 실패는 드물어 쿼터 부담이 작고, 문제 되면 그때 `beforeErrorSampling`으로 제한한다. 무료 쿼터(월 50개)를 넘으면 조용히 안 담길 뿐이다. 텍스트는 기본 마스킹(maskAllText) 그대로 둔다 — 발화 원문 보호.
- **DSN이 없으면 SDK가 조용히 꺼진다.** 로컬 개발이 기본적으로 프로젝트를 오염시키지 않는 이유. 로컬에서 전송을 테스트하고 싶을 때만 env에 DSN을 넣는다.
- **알림 규칙은 코드가 아니라 Sentry 대시보드에 있다.** 레벨은 심각도만 표시하고, 그걸로 언제 부를지는 대시보드에서 따로 정한다.

## 수집 경로

| 상황                                | 레벨    | 잡는 곳                                                                                               | 유저가 보는 것                        |
| ----------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 웹 페이지 렌더 중 예외              | error   | [apps/web/src/app/error.tsx](../apps/web/src/app/error.tsx)                                           | 우는 뱁새 + "다시 시도할게요"         |
| 루트 레이아웃까지 죽음              | error   | [apps/web/src/app/global-error.tsx](../apps/web/src/app/global-error.tsx) (인라인 스타일 최후 방어선) | 같은 화면                             |
| 이벤트 핸들러·비동기 예외           | error   | SDK 자동 (unhandled error/rejection)                                                                  | 화면 변화 없음                        |
| 서버 라우트(RSC·route handler) 예외 | error   | [apps/web/src/instrumentation.ts](../apps/web/src/instrumentation.ts) `onRequestError`                | —                                     |
| 대화 세션 시작 실패                 | error   | useConversationSession (reportError)                                                                  | 제출 시 토스트                        |
| 발화 제출 실패                      | error   | useConversationFlow (reportError)                                                                     | 토스트 + 재시도                       |
| NPS 제출 실패                       | error   | FeedbackSurvey (reportError)                                                                          | 감사 화면 (유실을 숨기므로 보고 필수) |
| STT 인식 오류 (권한 거부 제외)      | warning | useConversationInput (reportWarning)                                                                  | 토스트                                |
| TTS 합성·재생 실패                  | warning | useTts (reportWarning)                                                                                | 타이머 폴백으로 대화 계속             |
| 속마음 생성 실패·시간초과           | warning | useInnerThought (reportWarning)                                                                       | 속마음 생략하고 다음 턴               |
| 대화 세션 종료(중도 이탈) 실패      | warning | useConversationSession (reportWarning)                                                                | 없음 — 유저는 이미 나감               |

앱(웹뷰) 안에서 웹뷰 프로세스가 통째로 죽는 경우(흰 화면)는 Sentry가 못 잡는다 — 셸의 프로세스 복구 핸들러가 담당한다(별도 작업).

## 프로젝트·환경 구조

Sentry org는 백엔드와 같은 `saynow`. 기존 `{도메인}-{환경}` 컨벤션을 따른다.

| 프로젝트      | 대상                    | DSN이 사는 곳                                     |
| ------------- | ----------------------- | ------------------------------------------------- |
| `web-develop` | 웹 dev 배포·로컬 테스트 | Vercel Preview/Dev env, 필요 시 로컬 `.env.local` |
| `web-prod`    | 웹 프로덕션             | Vercel Production env                             |

## 환경변수

| 변수                                                  | 위치                                                     | 용도                                                |
| ----------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`                              | Vercel 환경별로 다른 프로젝트 DSN                        | 전송 대상. 없으면 SDK off                           |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Vercel에만. **auth token은 비밀 — 클라이언트 노출 금지** | 소스맵 업로드. 없으면 업로드만 스킵되고 빌드는 정상 |

DSN은 public key라 번들에 노출돼도 된다(전송만 가능, 조회 불가). 그래서 `NEXT_PUBLIC_` 접두사를 쓴다.

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
