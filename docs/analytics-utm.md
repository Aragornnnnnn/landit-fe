# UTM 유입 수집 규약

외부에서 앱/웹으로 들어오는 모든 링크에는 표준 UTM 파라미터로 유입 딱지를 단다.
알림·공유·광고·이메일 등 채널이 늘어나도 이 문서의 자리 규칙만 지키면 코드 수정 없이 유입 분석이 된다.

## 왜 UTM인가

- 업계 표준이라 앰플리튜드가 자동 인식한다 — attribution 오토캡처가 `utm_*`를 유저 프로퍼티(`initial_utm_source` 등)로 수집한다. 새 채널마다 계측 코드를 짤 필요가 없다.
- 커스텀 파라미터(`?from=...`)는 도구가 못 알아듣고, 읽는 코드를 매번 만들어야 해서 쓰지 않는다.

## 자리 규칙

5개 파라미터의 역할을 고정한다. 값은 전부 소문자 스네이크 케이스.
**source·medium·campaign 3개는 필수 세트**(어느 유입이든 함께 단다), content·term은 선택이다. 자리는 BE 서버 푸시가 다는 값을 기준으로 맞췄다.

- `utm_source` (필수) — **유입 수단.** 우리가 보내는 서버 푸시는 `push`, 홈 화면 위젯은 `widget`, 소셜이라면 어느 플랫폼인가(`kakao`/`instagram`), 이메일이면 발송 도구(`stibee`). GA 계열 도구는 source가 없으면 유입 자체를 인식하지 못한다
- `utm_medium` (필수) — **채널 종류.** 고정 어휘만 쓴다: `notification`(알림) `widget` `social` `email` `cpc`(유료 광고) `referral`
- `utm_campaign` (필수) — **발송/캠페인의 목적 이름.** `daily_scenario_reminder` `mailbox_reply` `launch_event` 같은 식으로 짓는다
- `utm_content` (선택) — **같은 캠페인 안의 변형 구분.** 문구 A/B, 소재 구분. 변형이 없으면 생략
- `utm_term` (선택) — 유료 검색 키워드용. 우리는 쓰지 않는다

기억법: **medium으로 채널을 묶고, source로 수단을 가르고, campaign으로 목적을 말하고, content로 변형을 나눈다.**

## 현재 등록된 조합

서버 푸시는 전부 `utm_source=push&utm_medium=notification`이고 캠페인만 다르다. 값은 BE `ScheduledNotificationContent.campaign()`·`PushQueueMessageHandler.mailboxReplyDeepLink()`가 정본이며, 아래 표는 그것을 옮겨 적은 것이다.

| 유입                     | 캠페인                    | 딥링크 경로                                         |
| ------------------------ | ------------------------- | --------------------------------------------------- |
| 오늘의 시나리오 리마인드 | `daily_scenario_reminder` | `/scenario`                                         |
| 표현 학습 이어가기       | `continue_expression`     | `/expressions/scenario/{scenarioId}/{expressionId}` |
| 스몰톡 리마인드          | `small_talk_reminder`     | `/smalltalk`                                        |
| 편지함 답장 도착         | `mailbox_reply`           | `/mailbox/received/{letterId}`                      |

예: `/scenario?utm_source=push&utm_medium=notification&utm_campaign=daily_scenario_reminder`

홈 화면 위젯 탭은 셸이 단다 — `/scenario?utm_source=widget&utm_medium=widget&utm_campaign=streak_widget` (`apps/mobile/src/widgets/widget-link.ts`). 웹은 `Page Viewed { entry_campaign: 'streak_widget' }`로 파생한다. iOS·Android 위젯 모두 `landit://widget` 딥링크로 앱을 열고, 셸이 그 URL을 알아보고 이 경로로 웹을 띄운다(콜드 스타트는 초기 URI, 앱이 떠 있으면 NAVIGATE 브릿지).

웹은 `utm_medium`이 `notification`(서버 푸시) 또는 `push`(1.1.0 셸이 예약해 둔 구 로컬 알림, `utm_source=landit`)면 알림 유입으로 읽는다. 어휘는 `apps/web/src/shared/analytics/utm.ts`에 있다.

문구 변형(시나리오 A1~~A4·R0~~R6, 표현·스몰톡 dynamic/generic)은 BE가 유저·날짜로 결정적으로 고르지만 **URL에는 실리지 않는다**. 문구별 성과를 보려면 BE가 `utm_content`에 변형 이름을 달아야 한다 — 그러면 웹은 코드 변경 없이 `entry_content`로 파생한다. 구 로컬 알림의 슬러그(`today_only` `white_bird` `give_up` `come_back` `marco_dm` `landy_letter` `flame_deadline`)는 남은 예약을 탭한 경우에만 들어온다.

## 확장 예시 (미리 합의된 자리)

| 채널               | source                | medium           | campaign 예시                   |
| ------------------ | --------------------- | ---------------- | ------------------------------- |
| 서버 푸시 신규     | `push`                | `notification`   | `comeback_d7`, `feature_launch` |
| 카카오 공유 링크   | `kakao`               | `social`         | `result_share`                  |
| 인스타 오가닉/광고 | `instagram`           | `social` / `cpc` | `launch_event`                  |
| 이메일             | `stibee` 등 발송 도구 | `email`          | `weekly_digest`                 |

알림은 로컬/서버를 따로 나누지 않는다 — 발송 묶음은 campaign 이름이 유일하게 식별하므로 그걸로 충분하다.

## 수집 파이프라인

1. **자동 수집 (기본)** — `apps/web/src/shared/analytics/amplitude.ts`의 attribution 오토캡처가 URL의 `utm_*`를 유저 프로퍼티로 담는다. 새 채널은 URL에 딱지만 달면 끝. 단 콜드 스타트(앱이 꺼진 상태에서 탭)만 잡는다 — 웜 딥링크는 SPA 내부 이동이라 어트리뷰션이 못 본다.
2. **이벤트 프로퍼티 파생** — 알림·위젯 유입은 `apps/web/src/shared/analytics/page-view.ts`가 어느 경로든 첫 `Page Viewed`에 `entry_campaign`(+ `entry_content`)을 싣는다. 웜 딥링크 유실을 막는 장치라 외부 유입엔 항상 붙는다. 어느 채널인지는 캠페인 이름이 가른다.

## 새 캠페인 추가 절차

1. 위 자리 규칙대로 URL에 `utm_*`를 붙인다 (이 문서의 "현재 등록된 조합" 표에 한 줄 추가)
2. 끝 — 자동 수집된다
3. (선택) 이벤트 프로퍼티가 필요하면 `page-view.ts`에 파생 규칙 + 테스트 추가

## 앰플리튜드에서 조회하는 법

수집이 두 갈래(이벤트 속성 / 유저 프로퍼티)라 차트도 목적별로 갈라 만든다.

**1. 알림 탭 유입 추이 — 몇 명이 알림을 눌러 들어오나**
Event Segmentation 차트 → 이벤트 `Page Viewed` → where `entry_campaign is not streak_widget` and `entry_campaign is set` → Uniques, 일별.
콜드·웜 딥링크 모두 잡히는 주 지표다. 오늘의 시나리오 리마인드만 보려면 `entry_campaign = daily_scenario_reminder`.

**2. 문구별 성과 — 어떤 문구가 탭을 부르나**
위 차트에서 group by `entry_content`. 서버 푸시는 아직 문구를 URL에 안 실어 비어 있다(위 "현재 등록된 조합" 참고).

**3. 알림 유입 유저 세그먼트 — 리텐션에 효과가 있나**
Cohort 생성 → who performed `Page Viewed` where `entry_campaign is set` → 이 코호트를 Retention 차트에 얹어 전체 유저와 비교.
유저 프로퍼티로도 가능: where `utm_medium = notification` (attribution 자동 수집분 — 콜드 유입만 확실하므로 코호트 방식을 우선).

**4. 동의 퍼널 — 어느 지면이 수락률이 좋은가**
Funnel 차트 → `Notification Consent Viewed` → `Notification Consent Accepted` → group by `source` (`scenario`/`me`).
온보딩 스텝의 수락은 기존 온보딩 퍼널(`Onboarding Step Viewed/Completed`, step=notification)로 본다.

**5. 캠페인 간 비교**
Event Segmentation 차트 → 이벤트 `Page Viewed` → where `entry_campaign is set` → group by `entry_campaign`. 위젯 탭(`streak_widget`)도 같은 표에 나란히 선다. 캠페인이 어느 경로로 딥링크하든 첫 화면의 `Page Viewed`에 붙으므로 홈 밖 캠페인(표현 학습·스몰톡·편지함)도 같은 차트에서 비교된다.

## 주의

- UTM은 **외부→앱 유입에만** 단다. 앱 내부 화면 이동에 붙이면 세션 어트리뷰션이 오염된다
- 표준 5개 외 커스텀 쿼리 파라미터로 유입을 표시하지 않는다 — 변형 구분은 `utm_content`로
- 값 어휘는 이 문서가 단일 출처다. 새 값을 만들면 표에 추가하고 PR에서 공유한다
