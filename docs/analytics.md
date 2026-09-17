# 앰플리튜드 이벤트 정책·택소노미

웹(apps/web) 전 플로우의 앰플리튜드 계측 규칙과 전체 이벤트 목록. 네이밍 컨벤션의 원문은 노션 "이벤트 네이밍 컨벤션" 문서를 따른다.

## 네이밍 규칙 요약

| 구분        | 규칙                                        | 예시                    |
| ----------- | ------------------------------------------- | ----------------------- |
| 이벤트      | Title Case + 공백, `[명사] + [과거형 동사]` | `Scenario Talk Started` |
| 이벤트 속성 | snake_case                                  | `scenario_id`           |
| 유저 속성   | snake_case (불리언은 `is_`/`has_`)          | `provider`              |

핵심 원칙.

- 변형은 이벤트명이 아니라 속성으로 나눈다 (`Login Completed` + `provider`, ❌ `Kakao Login Completed`).
- 이벤트명에 동적 값(id, 인덱스) 금지 — 전부 속성으로.
- 사용자 행동 중심으로 정의한다 (누가 한 행동인지 이름만으로 명확하게).
- **PII 금지** — 발화 원문, 의견 원문, 이메일, 닉네임은 속성에 넣지 않는다. `char_count`, `has_comment` 같은 파생값만 남긴다.

## 구조

- **이벤트명·속성 계약**: [`packages/analytics/src/events.ts`](../packages/analytics/src/events.ts) — `EVENTS` 상수와 이벤트별 속성 타입(`EventProps`). 코드에 이벤트명 문자열을 직접 쓰지 않는다. 네이밍 규칙은 `events.test.ts`가 계약 테스트로 강제한다(Title Case·과거형·중복·동적 값).
- **발화 래퍼**: [`apps/web/src/shared/analytics/amplitude.ts`](../apps/web/src/shared/analytics/amplitude.ts) — `track(EVENTS.X, props)` 단일 통로.
  - `NEXT_PUBLIC_AMPLITUDE_API_KEY`가 없으면 no-op으로 `console.debug`만 남긴다.
  - dev 환경(`NODE_ENV=development`)에선 키가 있어도 모든 이벤트를 콘솔에 같이 찍는다.
  - 세션 리플레이는 초기 단계라 **100% 수집**(`@amplitude/unified` `initAll`). **오토캡처는 전부 off** — 커스텀 이벤트(events.ts 계약)로 충분하고 노이즈·볼륨을 줄인다.
  - `minIdLength: 1` — 백엔드 회원번호가 1~4자리라 앰플리튜드 기본 5자 제한(400 Invalid id length)에 걸리는 것을 푼다.
  - 전 이벤트 공통 속성: `surface`(app|browser), `platform`(ios|android|web), `app_version`, `build_number` — 셸이 주입한 `window.__LANDIT_NATIVE__`(LAN-156)에서 온다.
- **유저 식별**: `AnalyticsBootstrap`이 auth 스토어를 구독해 로그인 시 `setUserId(member.userId)` + `provider` 유저 속성, 로그아웃 시 `reset()`. 앱/브라우저 어디서든 같은 유저로 묶인다.
- **화면 노출**: `PageViewTracker`가 라우트 변경마다 `Page Viewed` 발화. 동적 세그먼트는 `page_name`으로 정규화하고 id는 속성으로 뺀다. `/stt-demo`, `/dev`, `/`(즉시 redirect)는 제외. 이름을 안 준 주소는 폴백이 경로를 그대로 쓰므로, 화면을 더할 때 `page-view.ts`에 이름을 같이 등록한다 (두 칸짜리는 `NESTED_PAGES`). 빠뜨리면 `page-name-coverage.test.ts`가 라우트를 전부 훑어 잡는다.
- **서버 발화**: `/download`는 서버 302 리다이렉트라 클라이언트 SDK가 못 잡는다 — route 핸들러가 HTTP V2 API로 직접 발화한다(`Download Link Visited`). 키는 클라이언트와 같은 `NEXT_PUBLIC_AMPLITUDE_API_KEY`(공개 키라 서버 전용으로 나누지 않는다), device_id는 랜덤이라 방문 횟수 집계용.
- **dev/prod 분리**: 프로젝트 키를 환경별로 나눈다. 로컬·프리뷰는 dev 키, 프로덕션 배포 환경변수에만 prod 키.

## 이벤트 택소노미

### 공통

| 이벤트                  | 속성                                                                                                                                                                                    | 시점                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Page Viewed             | page_name, path, return_reason?, scenario_id?, session_id?, expression_id?, completed_date?, letter_id?, feedback_id?, feedback_type?, paywall_source?, entry_campaign?, entry_content? | 라우트 변경                                                   |
| Confirm Sheet Opened    | sheet(conversation_exit\|expression_exit\|account_delete)                                                                                                                               | 이탈·탈퇴 확인 시트 열림                                      |
| Confirm Sheet Dismissed | sheet                                                                                                                                                                                   | 확인 시트에서 계속하기/닫기                                   |
| Error Retried           | screen(scenario\|smalltalk\|conversation\|card_back\|expression_list\|streak\|mailbox)                                                                                                  | 에러 화면 "다시 시도"                                         |
| App Exited              | trigger(back_button)                                                                                                                                                                    | 네이티브 뒤로가기로 앱 종료 (셸에서만)                        |
| Download Link Visited   | store(play_store\|app_store)                                                                                                                                                            | /download 스토어 리다이렉트 진입 (서버 발화, 익명)            |
| App Update Store Opened | store(play_store\|app_store)                                                                                                                                                            | 앱 업데이트 유도 UI에서 스토어 앱을 직접 염 (클라이언트 발화) |

`return_reason`은 앱 안에서 홈으로 돌아온 이유(`flip` 표현 완료 복귀 / `card` 대화 이탈 복귀 / `just` 해금 직후). 확인 시트의 확정은 각각 `Conversation Abandoned` / `Expression Abandoned` / `Account Deleted`로 찍힌다.

`entry_campaign`·`entry_content`는 밖에서(알림·홈 화면 위젯 탭) 들어온 첫 화면에 붙는다 — 딥링크 URL의 `utm_medium`이 `notification`(서버 푸시)·`push`(구 로컬 알림)·`widget`이면 `utm_campaign`·`utm_content`에서 파생한다. 어느 경로로 딥링크했든 붙으며, 어느 채널인지는 캠페인 이름이 가른다(`daily_scenario_reminder`·`mailbox_reply`… / `streak_widget`). 어휘는 [analytics-utm.md](analytics-utm.md).

`completed_date`는 시나리오 화면에서 완료한 지난 날 카드를 볼 때만 붙는다 (yyyy-MM-dd) — 열 수 있는 과거는 완료한 날뿐이라, 없으면 오늘 카드다.

### 페이월

| 이벤트                      | 속성                                                                                             | 시점                                                                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paywall Plan Selected       | plan(monthly\|yearly)                                                                            | 페이월에서 다른 플랜 카드를 골랐을 때 (같은 카드 다시 누르면 안 찍음)                                                                                                                                                                                                            |
| Purchase Started            | plan(monthly\|yearly)                                                                            | CTA를 눌러 결제를 요청한 순간                                                                                                                                                                                                                                                    |
| Purchase Restore Tapped     | 없음                                                                                             | 구매 복원을 눌렀을 때                                                                                                                                                                                                                                                            |
| Purchase Completed          | plan, unlocked(bool), price?, currency?                                                          | 셸이 결제 성공을 회신했을 때. unlocked는 그 뒤 몇 초 안에 서버가 유료로 바뀌었는가. price·currency는 셸이 준 스토어 가격 — 매출 집계용이고, 오퍼링을 못 받아 표준 패키지로 결제하면 없다                                                                                         |
| Purchase Canceled           | plan                                                                                             | 사용자가 스토어 결제 시트를 닫았을 때                                                                                                                                                                                                                                            |
| Purchase Failed             | plan?, reason, message?                                                                          | 결제 실패, 또는 결제·복원을 시작할 수 없는 환경(browser / outdated_shell). reason은 browser / outdated_shell / no_response / shell_error. shell_error면 셸이 준 문구가 message. 복원이 막힌 경우엔 plan이 없다. 복원 요청 자체의 실패는 Purchase Restored { succeeded: false }다 |
| Purchase Restored           | succeeded(bool)                                                                                  | 구매 복원 요청이 끝났을 때. 셸 오류·응답 없음·복원할 내역 없음은 모두 succeeded=false                                                                                                                                                                                            |
| Paywall Gate Locked         | source(expression\|smalltalk\|conversation_finished\|feedback_detail)                            | 무료 사용자가 학습 진입, 첫 시나리오 피드백 끝, 또는 잠긴 상세 피드백 보기(feedback_detail, 둘째 시나리오부터)에서 페이월로 보내졌을 때. 대화 시작은 문이 아니다                                                                                                                 |
| Subscription Manage Tapped  | status(trial\|active\|canceled)                                                                  | 마이페이지 골드 카드에서 구독 관리로 들어감                                                                                                                                                                                                                                      |
| Paywall Entry Tapped        | source(me)                                                                                       | 게이트가 아닌 자리(마이페이지)에서 페이월로 들어감                                                                                                                                                                                                                               |
| Haptics Toggled             | enabled                                                                                          | 마이페이지 진동 시트에서 켜거나 껐을 때                                                                                                                                                                                                                                          |
| Subscription History Tapped | status(trial\|active\|canceled)                                                                  | 구독 관리에서 결제 내역으로 들어감                                                                                                                                                                                                                                               |
| Store Subscription Tapped   | status(trial\|active\|canceled), action(cancel\|resubscribe), reason?, method?                   | 스토어 구독 관리 링크를 눌렀을 때 — 해지 예약을 되돌릴 때는 구독 관리에서, 해지는 사유 플로우의 "그래도 해지하러 가기"에서(그때 reason·method가 붙는다)                                                                                                                          |
| Cancel Reason Selected      | reason(price\|time\|progress\|content\|bug\|other_method\|other), other_text?(기타일 때 적은 글) | 해지 사유 플로우 ①에서 사유를 고르고 "다음"을 눌렀을 때                                                                                                                                                                                                                          |
| Cancel Retention Viewed     | reason, plan?(가격일 때 monthly\|yearly), method?(다른 방법 ③일 때)                              | 사유별 화면(②·③)이 뜬 순간                                                                                                                                                                                                                                                       |
| Cancel Method Selected      | method(academy\|other_app\|youtube\|abroad)                                                      | 다른 방법 라디오에서 방법을 고르고 "다음"을 눌렀을 때                                                                                                                                                                                                                            |
| Cancel Stay Tapped          | reason, method?, to(manage\|mailbox)                                                             | 사유별 화면의 주 버튼으로 남았을 때 — 구독 관리로 돌아가거나(조금 더 써볼게요) 편지함으로 의견 보내러 갈 때                                                                                                                                                                      |
| Level Result Viewed         | scenario_id, level, change_type                                                                  | 무료 사용자가 첫 시나리오(서버가 상세를 열어 준 세션) 직후 레벨 결과 화면이 떴을 때. 쓸 수 있는 평가(MODEL·근거 충분)일 때만                                                                                                                                                     |
| Prepared Learning Viewed    | scenario_id                                                                                      | 대화 직후 학습 준비 화면(흐린 학습 4개, 내용 없음)이 떴을 때                                                                                                                                                                                                                     |
| Prepared Learning Continued | scenario_id                                                                                      | 그 화면에서 학습 시작하기를 눌렀을 때 (무료 사용자는 이어서 Paywall Gate Locked)                                                                                                                                                                                                 |

페이월 노출은 별도 이벤트 없이 `Page Viewed`(page_name=paywall)로 본다. 어느 문으로 왔는지는 같은 이벤트의 `paywall_source`가 남긴다 — 게이트에 막혀 왔으면 막힌 자리(`Paywall Gate Locked`의 source와 같은 값), 마이페이지에서 스스로 들어왔으면 `me`. 값은 `paywallPath`가 주소에 실어 보내고 주소를 손으로 고쳐도 모르는 값은 버린다. 노출과 전환이 한 이벤트에 묶여 있어야 진입 경로별 결제 전환율이 바로 나온다.

### 인증

| 이벤트           | 속성                          | 시점                 |
| ---------------- | ----------------------------- | -------------------- |
| Login Started    | provider, method(native\|web) | 로그인 버튼 탭       |
| Login Completed  | provider, method, is_new_user | 백엔드 로그인 성공   |
| Login Failed     | provider?, method, reason     | 실패 분기별 reason   |
| Login Canceled   | provider?                     | 사용자가 로그인 취소 |
| Logout Completed | —                             | 로그아웃             |
| Account Deleted  | —                             | 회원탈퇴 성공        |

`reason`: provider_error, start_failed, missing_request, state_mismatch, token_exchange_failed, login_api_failed, apple_web_unsupported.

### 온보딩

| 이벤트                    | 속성                                      | 시점                                                                          |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| Onboarding Started        | —                                         | 온보딩 진입                                                                   |
| Onboarding Step Viewed    | step, step_index                          | 스텝 노출 (intro→sound→mic→thought→notification→widget→level→accent→scenario) |
| Onboarding Step Completed | step                                      | 각 스텝 전진 CTA                                                              |
| Mic Permission Decided    | granted, source(onboarding\|conversation) | 마이크 권한 프롬프트 결과                                                     |
| Onboarding Completed      | —                                         | 마지막 스텝 시작하기                                                          |

`step_index`는 전체 스텝 기준 고정값이라 조건부 스텝이 빠져도 뒤 번호가 흔들리지 않는다. notification은 OS 권한이 아직 결정되지 않았을 때만, widget은 위젯이 실린 앱 버전이고 아직 설치 유도를 안 봤을 때만 들어간다. 알림 스텝의 완료는 OS 권한창 회신이 왔을 때 찍힌다(마이크 스텝과 같은 방식).

### 프로필 (영어 수준·배울 영어)

| 이벤트                | 속성                                                  | 시점                                                            |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Profile Gate Viewed   | question(level\|accent)                               | 온보딩을 이미 마친 기존 유저에게 홈에서 프로필 질문 게이트 노출 |
| Profile Gate Answered | question, level(1~5) 또는 accent(EN_US\|EN_GB\|EN_AU) | 게이트에서 답 선택                                              |
| Accent Changed        | accent                                                | 내 정보에서 배울 영어를 다시 고름                               |

신규 유저의 최초 응답은 온보딩 스텝(level·accent)이라 `Onboarding Step Viewed/Completed`로 잡히고, 게이트 이벤트는 온보딩 밖에서 묻는 기존 유저에게만 찍힌다. 질문이 늘어도 이름을 늘리지 않고 `question`으로 가른다. 답은 질문마다 속성이 달라(`level` / `accent`) 짝이 안 맞는 조합은 타입이 막는다.

### 홈

| 이벤트                | 속성                                                                                        | 시점                                          |
| --------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Home Tab Switched     | tab(scenario\|smalltalk)                                                                    | 상단 탭 칩 눌러 이동 (보고 있는 탭 재탭 제외) |
| Scenario Card Flipped | scenario_id, direction(back\|front), trigger(button\|auto)                                  | 원어민 표현 배우기 / 자동 뒤집힘 / 앞면 복귀  |
| Expression Selected   | expression_id, 출처(scenario_id\|session_id), source(card_back\|post_conversation\|history) | 표현 항목 탭                                  |

### 오늘의 시나리오 (램프)

대화 시작 전 갈림길 세 곳. 온보딩 직후 자동 진행은 누른 버튼이 없어 기록하지 않는다.

| 이벤트                        | 속성  | 시점                                            |
| ----------------------------- | ----- | ----------------------------------------------- |
| Conversation Start Tapped     | retry | 자고 있는 카드의 "램프 문질러 대화 시작하기" 탭 |
| Conversation Prompt Accepted  | retry | 자동으로 뜬 "오늘의 대화를 시작할까요?"에 "네!" |
| Conversation Prompt Dismissed | retry | 그 프롬프트를 X·뒤로가기로 닫음                 |

`retry`는 전날 못 끝낸 대화를 이어받은 카드였는지 (오늘 새로 받은 시나리오면 false). 완료 카드의 "다시 대화하기"는 램프를 거치지 않으며 `Scenario Talk Started`의 `is_retry`로 잡힌다.

### 달력 스트립

| 이벤트                 | 속성                        | 시점                                                   |
| ---------------------- | --------------------------- | ------------------------------------------------------ |
| Calendar Date Selected | is_today                    | 주 스트립·월 격자에서 날짜 탭 (열 수 있는 날만 눌린다) |
| Calendar View Switched | view(week\|month)           | 주↔월 전환 (토글·바깥 탭·뒤로가기로 접는 것 포함)      |
| Calendar Period Moved  | direction(prev\|next), view | 이전/다음 화살표로 주·월 넘김                          |

`is_today: false`면 완료한 지난 날이다 — 어느 날인지는 이어지는 `Page Viewed`의 `completed_date`가 남긴다.

### 스트릭

| 이벤트               | 속성                                              | 시점                                            |
| -------------------- | ------------------------------------------------- | ----------------------------------------------- |
| Streak Opened        | source(home_header), streak_days, is_active_today | 홈 헤더 열매를 눌러 연속 기록 화면 진입         |
| Streak Month Changed | direction(prev\|next), year, month                | 연속 기록 달력에서 달 넘김 (떠나는 달을 남긴다) |

`Streak Opened`는 어떤 상태(며칠째, 오늘 채웠는지)에서 눌리는지를 본다. 화면 노출 자체는 `Page Viewed(streak)`가 찍는다.

### 시나리오 대화

| 이벤트                       | 속성                                                                     | 시점                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario Talk Started        | scenario_id, session_id, first_speaker, is_retry                         | 세션 시작 성공                                                                                                                          |
| Recording Started            | session_id?, turn_index                                                  | 마이크 눌러 말하기                                                                                                                      |
| Recording Stopped            | session_id?, turn_index                                                  | ■ 답변 완료 탭 (결과는 각 대화의 Turn Completed / Turn Failed)                                                                          |
| Recording Canceled           | session_id?, turn_index                                                  | 듣기 취소 (음성)                                                                                                                        |
| Mic Settings Opened          | —                                                                        | 권한 안내에서 "설정 열기"                                                                                                               |
| Input Mode Switched          | session_id?, mode(text\|voice)                                           | 키보드↔마이크 전환 (타이핑 취소 포함)                                                                                                   |
| Scenario Talk Turn Completed | session_id, scenario_id, turn_index, input_type(voice\|text), char_count | 발화 제출 성공                                                                                                                          |
| Turn Failed                  | session_id?, turn_index, reason(empty\|api_error)                        | 빈 발화 / 제출 실패                                                                                                                     |
| Inner Thought Viewed         | session_id, turn_index, thought_type?                                    | 상대 속마음 노출                                                                                                                        |
| Translation Toggled          | session_id?, turn_index, opened                                          | 상대 발화 해석을 펼침(true)/접음(false)                                                                                                 |
| Speech Replayed              | session_id?, turn_index                                                  | 상대 발화 다시 듣기 시작 (멈추려고 누른 건 안 찍음)                                                                                     |
| Speech Recognition Failed    | engine?, reason?                                                         | STT 오류 (권한 거부 제외)                                                                                                               |
| Speech Playback Failed       | source(synth\|question_audio)                                            | AI 발화 재생 실패 — 실패 비율용. question_audio는 서버 음원(오프닝 첫 질문·이어 재생 질문), 스몰톡 탭 인사도 포함 (synth 원인은 Sentry) |
| Scenario Talk Completed      | session_id, scenario_id, turn_count                                      | 서버가 완료 판정                                                                                                                        |
| Scenario Talk Abandoned      | session_id?, scenario_id, turn_index                                     | 중도 이탈 확정                                                                                                                          |

`session_id`가 optional인 이벤트는 세션이 백그라운드로 시작돼 확보 전에도 발생할 수 있다.

### 스몰톡

| 이벤트                        | 속성                                                                                        | 시점                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Small Talk Partner Selected   | partner                                                                                     | 탭에서 상대 칩 선택                                     |
| Small Talk Topic Selected     | partner, topic_id                                                                           | 주제 모달에서 주제 선택                                 |
| Small Talk Intro Guide Closed | —                                                                                           | 첫 진입 안내 닫음 (기기당 한 번)                        |
| Small Talk Greeting Tapped    | partner, coached                                                                            | 캐릭터를 눌러 인사 들음 (coached=코치마크 켜진 채 누름) |
| Small Talk Started            | session_id, partner, first_speaker, topic_id?                                               | 세션 시작 성공                                          |
| Small Talk Turn Completed     | session_id, partner, turn_index, input_type(voice\|text), char_count, utterance_duration_ms | 발화 제출 성공                                          |
| Small Talk Completed          | session_id, partner, turn_count, speaking_duration_ms, end_reason(user_ended\|time_limit)   | 서버가 완료 판정                                        |
| Small Talk Abandoned          | session_id, partner, turn_index                                                             | 중도 이탈 확정                                          |

스몰톡은 탭도 목적도 달라 대화 이벤트를 따로 둔다 — 시나리오는 오늘의 과제를 끝냈는지, 스몰톡은 누구와 얼마나 얘기했는지를 본다. 상대(`partner`)는 시나리오에 없는 축이라 전 이벤트에 싣는다.

탭의 네 이벤트는 대화 시작 전 갈림길이다. 기본 상대로 그냥 시작하면 `Partner Selected`는 안 찍히고 `Started`의 `partner`로 본다. 주제 모달 열림은 안 찍는다 — `Started`의 `topic_id` 유무로 "주제로 시작" 비율이 나온다.

단, 마이크·STT처럼 **대화 엔진이 쏘는 것은 두 대화가 함께 쓴다** (Recording Started/Stopped/Canceled, Input Mode Switched, Turn Failed, Inner Thought Viewed, Translation Toggled, Speech Replayed, Speech Recognition Failed, Speech Playback Failed). 입력 기계의 사건이라 어느 대화인지와 무관하고, 대화 엔진(features/conversation)은 대화 종류를 모른다.

### 분석 피드백

| 이벤트                 | 속성                                                                           | 시점                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Feedback Viewed        | session_id, detail_locked, good_count, turn_count, native_score?, star_rating? | 총평 노출. detail_locked면 서버가 상세를 비워 보낸 세션이라 good_count·turn_count가 0 — 평균낼 때 걸러야 한다 |
| Feedback Skipped       | session_id                                                                     | 총평만 보고 상세 없이 나감 (Completed와 배타)                                                                 |
| Feedback Detail Opened | session_id                                                                     | 상세 분석 진입                                                                                                |
| Feedback Turn Viewed   | session_id, turn_index, feedback_type                                          | 턴별 분석 노출                                                                                                |
| Feedback Completed     | session_id                                                                     | 분석 다 봤어요                                                                                                |

### 소감 시트

| 이벤트                       | 속성                                | 시점                                                    |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------- |
| Satisfaction Prompt Viewed   | moment(scenario\|smalltalk\|review) | 대화를 마치고 홈에 돌아와 소감 시트가 뜸                |
| Satisfaction Prompt Answered | moment, answer(good\|bad\|dismiss)  | 좋았어요/아쉬웠어요 탭, 또는 딤·뒤로가기로 닫음         |
| Review Store Opened          | store(play_store\|app_store)        | 랜딧 소감(app)에서 좋았어요 → 별점판 → 리뷰 남기러 가기 |

moment: scenario·smalltalk = 그 대화를 처음 마쳤을 때, app = 다른 날 두 번째 이상의 시나리오 대화를 마쳤을 때(랜딧 전체를 묻고 별점을 유도). 기기당 순간마다 한 번만 뜬다. dismiss도 답으로 셈해 다시 묻지 않고, 첫 소감이 bad였던 사람에겐 app을 묻지 않는다.

### 표현 학습

| 이벤트                      | 속성                                                              | 시점                                                           |
| --------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Expression List Viewed      | 출처(scenario_id\|session_id), expression_count                   | 분기 화면 리스트 리빌                                          |
| Expression Learning Skipped | 출처(scenario_id\|session_id), expression_count                   | 분기 화면을 X로 닫고 학습 없이 나감 (연출 중이면 count 0 가능) |
| Expression Learning Started | expression_id, 출처(scenario_id\|session_id)                      | 학습 데이터 로드 완료                                          |
| Expression Step Viewed      | expression_id, step(quiz\|explain\|pronounce\|examples\|review)   | 스텝 노출                                                      |
| Quiz Word Picked            | expression_id, picked_count                                       | 단어 칩 선택                                                   |
| Quiz Word Removed           | expression_id, picked_count                                       | 단어 칩 제거                                                   |
| Quiz Answer Submitted       | expression_id, is_correct, hint_level                             | 퀴즈 확인                                                      |
| Example Sentence Viewed     | expression_id, sentence_index                                     | 예문 캐러셀 스냅                                               |
| Pronunciation Result Viewed | expression_id, score, passed, error_count, attempt                | 발음 분석 결과 도착 (재도전 포함, attempt=회차)                |
| Pronunciation Skipped       | expression_id                                                     | 설명 화면에서 "지금은 말할 수 없어요"로 발음 건너뛰기          |
| Pronunciation Audio Played  | expression_id, source(expression\|sentence\|native_word\|my_word) | 듣기 버튼 재생 (자동재생·토글 끄기 제외)                       |
| Review Answer Submitted     | expression_id, is_correct, hint_level                             | 복습 영작 확인 (오답이어도 재시도 없이 완료로 이어진다)        |
| Hint Used                   | source(quiz\|review), level                                       | 힌트 보기 (퀴즈·복습 모두 일회성, 누를 때마다 level 1)         |
| Expression Completed        | expression_id, 출처(scenario_id\|session_id)                      | 학습 완료 처리 성공                                            |
| Expression Abandoned        | expression_id, step                                               | 중단 확정                                                      |

표현 학습 화면은 시나리오 대화와 스몰톡이 같이 쓴다. 어디서 온 표현인지는 출처 속성으로 갈린다 — 시나리오 표현이면 `scenario_id`, 스몰톡 표현이면 `session_id`가 실린다.

### 편지함

| 이벤트                 | 속성                                                        | 시점                         |
| ---------------------- | ----------------------------------------------------------- | ---------------------------- |
| Mailbox Tab Switched   | box(received\|sent)                                         | 받은/보낸 칸 이동            |
| Feedback Type Selected | feedback_type(BUG_REPORT\|FEATURE_REQUEST\|QUESTION\|CHEER) | 유형 선택 화면에서 하나 고름 |
| Feedback Submitted     | feedback_type, length                                       | 피드백 전송 성공             |

원문은 PII 위험이 있어 싣지 않는다 — 길이만 남긴다. `Feedback Submitted`는 전송이 성공한 뒤에만 쏜다.

편지 상세와 피드백 작성 진입은 `Page Viewed`가 담당한다. 편지 상세는 받은·보낸이 서로 다른
리소스라 화면 이름도 갈리고(`mailbox_received`+letter_id / `mailbox_sent`+feedback_id),
목록은 칸을 옮겨도 같은 화면이라 `mailbox` 하나다. 작성은 유형마다 주소가 갈려도 화면 이름은
`feedback_compose` 하나로 두고 고른 유형을 `feedback_type`으로 싣는다.

### 알림

| 이벤트                          | 속성                                      | 시점                                                     |
| ------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| Notification Consent Viewed     | source(scenario\|me)                      | 알림 안내 시트 노출                                      |
| Notification Consent Accepted   | source                                    | 시트에서 수락 (OS 권한창 요청까지 이어짐)                |
| Notification Consent Dismissed  | source                                    | 시트 닫음                                                |
| Notification Permission Decided | granted, source(onboarding\|scenario\|me) | OS 권한창 결과 — 셸의 회신에서 찍는다 (마이크와 같은 짝) |

온보딩의 알림 스텝은 시트 없이 바로 OS 권한창을 띄워 Consent 이벤트가 없고, 결과는 `Notification Permission Decided(source: onboarding)`로 남는다. 이미 거부한 상태에서 내 정보의 "OS 설정 열기"는 안 찍는다 — 결과를 알 수 없다.

### 위젯 설치 안내

| 이벤트                           | 속성                         | 시점                                                                   |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Widget Install Invite Viewed     | source(onboarding\|me)       | 설치 유도 화면 노출 — 온보딩 widget 스텝 또는 마이페이지 홈 화면 위젯  |
| Widget Install Invite Answered   | answer, source               | "위젯 추가하기" / "나중에 하기"                                        |
| Widget Pin Requested             | platform, source             | 추가를 실제로 청한 순간 — Android는 시스템 핀 다이얼로그, iOS는 안내로 |
| Widget Install Guide Step Viewed | step(press\|menu\|search)    | iOS 갤러리 여는 길 안내 3장 각각 노출 (어디서 이탈하는지)              |
| Widget Installed                 | family(small\|medium\|large) | 홈 화면에 위젯이 실제로 놓임 — 셸이 브릿지로 넘긴다                    |
| Widget Removed                   | family                       | 홈 화면에서 위젯이 치워짐                                              |

`Widget Pin Requested`는 요청이지 설치가 아니다 — 설치 안내 → 실제 설치 전환은 `Widget Installed`로 본다. 설치 유도는 기기당 한 번만 노출된다.

`Widget Installed`/`Removed`는 안드로이드는 위젯 프로바이더 콜백에서, iOS는 앱 실행·포그라운드 복귀 때 놓인 위젯 목록을 지난번과 비교해 만든다. 그래서 iOS는 설치한 뒤 앱으로 돌아온 시점에 찍히고, 앱을 안 열면 다음 실행 때 잡힌다. 위젯 탭 유입은 `Page Viewed { entry_campaign: 'streak_widget' }`이다.

### 결제 전 설문 (LAN-428, 임시)

설문이 끝나면 설문 코드(`features/survey`)와 함께 지운다. 완료 응답 자체는 슈퍼베이스에 있으니 여기서는 퍼널(편지 → 진입 → 문항별 이탈 → 제출)만 본다.

| 이벤트                 | 속성                        | 시점                                                         |
| ---------------------- | --------------------------- | ------------------------------------------------------------ |
| Survey Invite Tapped   | letter_id                   | 설문 안내 편지의 "설문하고 이용권 받기"                      |
| Survey Started         | —                           | 인트로에서 시작하기                                          |
| Survey Question Viewed | question_id, question_index | 문항 노출 (뒤로 갔다 다시 봐도 찍힌다)                       |
| Survey Submitted       | question_count              | 저장 성공 (이미 참여한 사람의 재제출도 서버가 성공으로 답함) |

답 내용은 싣지 않는다. `question_id`는 설문 정의(`questions.ts`)의 id 그대로이고, `question_index`는 조건 문항이 끼고 빠진 뒤 그 사람에게 보인 순서다. 설문 화면 진입은 `Page Viewed(survey)`가 찍는다.

### 유저 속성

사람에 붙는 값이다. 설정한 뒤에 찍힌 이벤트부터 따라붙고, 이미 쌓인 과거 이벤트에는 소급되지 않는다 — 무료였던 시절 이벤트가 `is_premium=false`로 남아야 전환 퍼널이 맞게 나오므로 이게 맞는 동작이다.

| 속성                                            | 값                                             | 시점                        |
| ----------------------------------------------- | ---------------------------------------------- | --------------------------- |
| provider                                        | kakao \| google \| apple                       | 로그인 식별 시              |
| surface / platform / app_version / build_number | 네이티브 컨텍스트                              | 초기화 시                   |
| is_premium                                      | 참·거짓 (모르는 동안은 지움)                   | 구독 조회 결과가 바뀔 때    |
| subscription_state                              | unknown \| none \| trial \| active \| canceled | 구독 조회 결과가 바뀔 때    |
| plan                                            | monthly \| yearly (유료가 아니면 지움)         | 구독 조회 결과가 바뀔 때    |
| learning_level                                  | 1~5 (아직 없으면 지움)                         | 학습 수준·배울 영어 도착 시 |
| accent_locale                                   | EN_US \| EN_GB \| EN_AU (아직 없으면 지움)     | 학습 수준·배울 영어 도착 시 |

이름은 백엔드 필드(`learningLevel`, `accentLocale`)에 맞춘다 — 이벤트 속성 쪽이 `level`·`accent`·`status`로 짧은 것과 어긋나 보이지만, 이미 쌓이고 있는 이벤트 속성을 바꾸면 과거 데이터가 갈라진다. 유저 속성은 서버 데이터와 같은 말을 쓰는 쪽을 택했다.

계약은 `packages/analytics`의 `UserProperties`에 있고, 발화는 `setUserProperties`(값이 `null`이면 속성을 지운다) 하나를 지나간다. 올리는 자리는 루트 레이아웃에 마운트한 무렌더 컴포넌트 둘이다 — 구독은 `SubscriptionPropertiesSync`, 수준·배울 영어는 `ProfilePropertiesSync`. 표의 위 두 줄은 이 통로를 지나지 않는다 — `provider`는 로그인 식별(`identifyUser`)이, 네이티브 컨텍스트 넷은 초기화(`initAnalytics`)가 각각 따로 올린다.

`subscription_state`의 `unknown`은 구독을 한 번도 받지 못한 동안이다 — 로그인 직후 첫 조회가 끝나기 전, 그리고 그 첫 조회가 실패한 동안. 그 구간에는 `is_premium`·`plan`을 지워 지난 세션 값이 남지 않게 한다. "유료 여부를 몰라서 빈 것"과 "속성을 아예 안 쓰던 시절이라 빈 것"을 나중에 구분할 수 있게. 앱을 켜자마자 나가는 홈 `Page Viewed`가 여기 걸린다.

한 번 받아 둔 뒤에는 재조회가 실패해도 마지막 값을 유지한다. 포그라운드로 돌아올 때마다 구독을 다시 묻는데(전역 `staleTime` 30초 + 포커스 재조회), 그중 한 번이 실패했다고 유료 사용자의 유료 표시가 사라지면 안 된다. 페이월·게이트 이벤트는 구독 조회가 끝나야 잠금 판정이 서므로 항상 확정된 값을 달고 간다.

로그인하지 않은 구간의 이벤트에는 이 속성들이 `unknown`도 아니고 아예 없다. 코호트를 짤 때 "속성 없음"은 익명이거나 계약 도입 전 이벤트다.

### 계측하지 않는 것 (의도적 제외 — 전수 감사로 확정)

아래는 놓친 게 아니라 검토 후 뺀 것이다. 원클릭 수준까지 필요해지면 오토캡처 elementInteractions를 다시 켜서 사후 수집할 수 있다.

- 키 입력·IME 글자 단위, 피드백 작성 타이핑, 복습 영작 단어 박스 포커스 — 노이즈 대비 분석 가치가 없다.
- 단순 화면 이동 버튼(내 정보·약관 링크, 뒤로가기, 콜백 "로그인으로 돌아가기") — `Page Viewed`가 목적지를 찍는다.
- 바텀시트 오버레이 클릭 닫기 — ✕/닫기 버튼 이벤트와 중복. 시트별 닫기는 `Confirm Sheet Dismissed`가 담당.
- 상세 분석 첫 장에서 ‹로 총평 복귀 — `Feedback Turn Viewed`/`Feedback Detail Opened` 재발화로 추적 가능.
- 장식성 인터랙션(스크롤 그림자, 전역 햅틱 pointerdown), TTS 재생 내부 상태, `/stt-demo`·`/dev` 개발 화면.

## 신규 이벤트 추가 체크리스트

- [ ] `[명사] + [과거형 동사]`, Title Case인가?
- [ ] 같은 행동을 이미 추적하는 이벤트가 있는가? (중복 금지)
- [ ] 변형은 속성으로 분리했는가? 동적 값이 이벤트명에 없는가?
- [ ] PII가 포함되지 않았는가?
- [ ] `packages/analytics`의 `EVENTS`·`EventProps`에 등록하고 이 문서 표를 갱신했는가?
