# 앰플리튜드 이벤트 정책·택소노미

웹(apps/web) 전 플로우의 앰플리튜드 계측 규칙과 전체 이벤트 목록. 네이밍 컨벤션의 원문은 노션 "이벤트 네이밍 컨벤션" 문서를 따른다.

## 네이밍 규칙 요약

| 구분        | 규칙                                        | 예시                   |
| ----------- | ------------------------------------------- | ---------------------- |
| 이벤트      | Title Case + 공백, `[명사] + [과거형 동사]` | `Conversation Started` |
| 이벤트 속성 | snake_case                                  | `scenario_id`          |
| 유저 속성   | snake_case (불리언은 `is_`/`has_`)          | `provider`             |

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
  - 세션 리플레이는 초기 단계라 **100% 수집**(`@amplitude/unified` `initAll`). **오토캡처는 전부 off** — 커스텀 이벤트 53종으로 충분하고 노이즈·볼륨을 줄인다.
  - `minIdLength: 1` — 백엔드 회원번호가 1~4자리라 앰플리튜드 기본 5자 제한(400 Invalid id length)에 걸리는 것을 푼다.
  - 전 이벤트 공통 속성: `surface`(app|browser), `platform`(ios|android|web), `app_version`, `build_number` — 셸이 주입한 `window.__LANDIT_NATIVE__`(LAN-156)에서 온다.
- **유저 식별**: `AnalyticsBootstrap`이 auth 스토어를 구독해 로그인 시 `setUserId(member.userId)` + `provider` 유저 속성, 로그아웃 시 `reset()`. 앱/브라우저 어디서든 같은 유저로 묶인다.
- **화면 노출**: `PageViewTracker`가 라우트 변경마다 `Page Viewed` 발화. 동적 세그먼트는 `page_name`으로 정규화하고 id는 속성으로 뺀다. `/stt-demo`, `/dev`, `/`(즉시 redirect)는 제외.
- **dev/prod 분리**: 프로젝트 키를 환경별로 나눈다. 로컬·프리뷰는 dev 키, 프로덕션 배포 환경변수에만 prod 키.

## 이벤트 택소노미 (53개)

### 공통

| 이벤트                  | 속성                                                          | 시점                                   |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Page Viewed             | page_name, path, return_reason?, scenario_id?, expression_id? | 라우트 변경                            |
| Confirm Sheet Opened    | sheet(conversation_exit\|expression_exit\|account_delete)     | 이탈·탈퇴 확인 시트 열림               |
| Confirm Sheet Dismissed | sheet                                                         | 확인 시트에서 계속하기/닫기            |
| Error Retried           | screen(home\|conversation\|card_back\|expression_list)        | 에러 화면 "다시 시도"                  |
| App Exited              | trigger(back_button)                                          | 네이티브 뒤로가기로 앱 종료 (셸에서만) |

`return_reason`은 홈 복귀 신호(`flip` 표현 완료 복귀 / `card` 대화 이탈 복귀 / `just` 해금 직후). 확인 시트의 확정은 각각 `Conversation Abandoned` / `Expression Abandoned` / `Account Deleted`로 찍힌다.

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

| 이벤트                    | 속성                                      | 시점                                         |
| ------------------------- | ----------------------------------------- | -------------------------------------------- |
| Onboarding Started        | —                                         | 온보딩 진입                                  |
| Onboarding Step Viewed    | step, step_index                          | 스텝 노출 (intro→sound→mic→thought→scenario) |
| Onboarding Step Completed | step                                      | 각 스텝 전진 CTA                             |
| Mic Permission Decided    | granted, source(onboarding\|conversation) | 마이크 권한 프롬프트 결과                    |
| Onboarding Completed      | —                                         | 마지막 스텝 시작하기                         |

### 홈

| 이벤트                | 속성                                                                                            | 시점                                         |
| --------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Category Selected     | category_id, category_name, is_locked                                                           | 카테고리 칩 탭                               |
| Scenario Card Viewed  | card_type(scenario\|completion), position, scenario_id?, difficulty?, is_completed?, is_locked? | 스냅으로 카드가 중앙에 설 때                 |
| Scenario Card Flipped | scenario_id, direction(back\|front), trigger(button\|auto)                                      | 원어민 표현 배우기 / 자동 뒤집힘 / 앞면 복귀 |
| Expression Selected   | expression_id, scenario_id, source(card_back\|post_conversation)                                | 표현 항목 탭                                 |

### 대화

| 이벤트                    | 속성                                                                     | 시점                                          |
| ------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| Conversation Started      | scenario_id, session_id, first_speaker, is_retry                         | 세션 시작 성공                                |
| Recording Started         | session_id?, turn_index                                                  | 마이크 눌러 말하기                            |
| Recording Stopped         | session_id?, turn_index                                                  | ■ 답변 완료 탭 (결과는 Turn Completed/Failed) |
| Recording Canceled        | session_id?, turn_index                                                  | 듣기 취소 (음성)                              |
| Mic Settings Opened       | —                                                                        | 권한 안내에서 "설정 열기"                     |
| Input Mode Switched       | session_id?, mode(text\|voice)                                           | 키보드↔마이크 전환 (타이핑 취소 포함)         |
| Turn Completed            | session_id, scenario_id, turn_index, input_type(voice\|text), char_count | 발화 제출 성공                                |
| Turn Failed               | session_id?, turn_index, reason(empty\|api_error)                        | 빈 발화 / 제출 실패                           |
| Inner Thought Viewed      | session_id, turn_index, thought_type?                                    | 상대 속마음 노출                              |
| Speech Recognition Failed | engine?, reason?                                                         | STT 오류 (권한 거부 제외)                     |
| Conversation Completed    | session_id, scenario_id, turn_count                                      | 서버가 완료 판정                              |
| Conversation Abandoned    | session_id?, scenario_id, turn_index                                     | 중도 이탈 확정                                |

`session_id`가 optional인 이벤트는 세션이 백그라운드로 시작돼 확보 전에도 발생할 수 있다.

### 분석 피드백

| 이벤트                 | 속성                                                            | 시점                                          |
| ---------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Feedback Viewed        | session_id, good_count, turn_count, native_score?, star_rating? | 총평 노출                                     |
| Feedback Skipped       | session_id                                                      | 총평만 보고 상세 없이 나감 (Completed와 배타) |
| Feedback Detail Opened | session_id                                                      | 상세 분석 진입                                |
| Feedback Turn Viewed   | session_id, turn_index, feedback_type                           | 턴별 분석 노출                                |
| Feedback Completed     | session_id                                                      | 분석 다 봤어요                                |

### 표현 학습

| 이벤트                      | 속성                                               | 시점                                                              |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Expression List Viewed      | scenario_id, expression_count                      | 분기 화면 리스트 리빌                                             |
| Expression Learning Skipped | scenario_id, expression_count                      | 분기에서 "다음 대화하러 갈게요"                                   |
| Expression Learning Started | expression_id, scenario_id                         | 학습 데이터 로드 완료                                             |
| Expression Step Viewed      | expression_id, step(quiz\|explain\|review)         | 스텝 노출                                                         |
| Quiz Word Picked            | expression_id, picked_count                        | 단어 칩 선택                                                      |
| Quiz Word Removed           | expression_id, picked_count                        | 단어 칩 제거                                                      |
| Quiz Answer Submitted       | expression_id, is_correct, hint_level              | 퀴즈 확인                                                         |
| Example Sentence Viewed     | expression_id, sentence_index                      | 예문 캐러셀 스냅                                                  |
| Review Answer Submitted     | expression_id, is_correct, wrong_count, hint_level | 복습 영작 확인                                                    |
| Hint Used                   | source(quiz\|review), level                        | 힌트 보기 (퀴즈=일회성·누를 때마다 level 1, 복습=힌트→정답 2단계) |
| Expression Completed        | expression_id, scenario_id                         | 학습 완료 처리 성공                                               |
| Expression Abandoned        | expression_id, step                                | 중단 확정                                                         |

### NPS

| 이벤트               | 속성                                   | 시점               |
| -------------------- | -------------------------------------- | ------------------ |
| NPS Survey Opened    | source(home_header\|all_completed\|me) | 의견 보내기 열기   |
| NPS Score Selected   | score(1–5)                             | 만족도 이모지 탭   |
| NPS Survey Submitted | score(1–5), has_comment                | 의견 제출          |
| NPS Survey Dismissed | score?                                 | ✕로 제출 없이 닫음 |

### 유저 속성

| 속성                                            | 값                       | 시점           |
| ----------------------------------------------- | ------------------------ | -------------- |
| provider                                        | kakao \| google \| apple | 로그인 식별 시 |
| surface / platform / app_version / build_number | 네이티브 컨텍스트        | 초기화 시      |

### 계측하지 않는 것 (의도적 제외 — 전수 감사로 확정)

아래는 놓친 게 아니라 검토 후 뺀 것이다. 원클릭 수준까지 필요해지면 오토캡처 elementInteractions를 다시 켜서 사후 수집할 수 있다.

- 키 입력·IME 글자 단위, NPS 코멘트 타이핑, 복습 영작 단어 박스 포커스 — 노이즈 대비 분석 가치가 없다.
- 단순 화면 이동 버튼(내 정보·약관 링크, 뒤로가기, 콜백 "로그인으로 돌아가기") — `Page Viewed`가 목적지를 찍는다.
- 바텀시트 오버레이 클릭 닫기 — ✕/닫기 버튼 이벤트와 중복. 시트별 닫기는 `Confirm Sheet Dismissed`·`NPS Survey Dismissed`가 담당.
- 상세 분석 첫 장에서 ‹로 총평 복귀 — `Feedback Turn Viewed`/`Feedback Detail Opened` 재발화로 추적 가능.
- 장식성 인터랙션(스크롤 그림자, 전역 햅틱 pointerdown), TTS 재생 내부 상태, `/stt-demo`·`/dev` 개발 화면.

## 신규 이벤트 추가 체크리스트

- [ ] `[명사] + [과거형 동사]`, Title Case인가?
- [ ] 같은 행동을 이미 추적하는 이벤트가 있는가? (중복 금지)
- [ ] 변형은 속성으로 분리했는가? 동적 값이 이벤트명에 없는가?
- [ ] PII가 포함되지 않았는가?
- [ ] `packages/analytics`의 `EVENTS`·`EventProps`에 등록하고 이 문서 표를 갱신했는가?
