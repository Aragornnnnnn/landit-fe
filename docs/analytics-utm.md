# UTM 유입 수집 규약

외부에서 앱/웹으로 들어오는 모든 링크에는 표준 UTM 파라미터로 유입 딱지를 단다.
알림·공유·광고·이메일 등 채널이 늘어나도 이 문서의 자리 규칙만 지키면 코드 수정 없이 유입 분석이 된다.

## 왜 UTM인가

- 업계 표준이라 앰플리튜드가 자동 인식한다 — attribution 오토캡처가 `utm_*`를 유저 프로퍼티(`initial_utm_source` 등)로 수집한다. 새 채널마다 계측 코드를 짤 필요가 없다.
- 커스텀 파라미터(`?from=...`)는 도구가 못 알아듣고, 읽는 코드를 매번 만들어야 해서 쓰지 않는다.

## 자리 규칙

5개 파라미터의 역할을 고정한다. 값은 전부 소문자 스네이크 케이스.
**source·medium·campaign 3개는 필수 세트**(어느 유입이든 함께 단다), content·term은 선택이다.

- `utm_source` (필수) — **발신 주체·플랫폼 이름.** 우리가 보내는 알림은 전부 `landit`, 소셜이라면 어느 플랫폼인가(`kakao`/`instagram`). GA 계열 도구는 source가 없으면 유입 자체를 인식하지 못한다
- `utm_medium` (필수) — **채널 종류.** 고정 어휘만 쓴다: `push` `widget` `social` `email` `cpc`(유료 광고) `referral`
- `utm_campaign` (필수) — **발송/캠페인의 목적 이름.** `daily_reminder` `comeback_d7` `launch_event` 같은 식으로 짓는다
- `utm_content` (선택) — **같은 캠페인 안의 변형 구분.** 문구 A/B, 소재 구분. 변형이 없으면 생략
- `utm_term` (선택) — 유료 검색 키워드용. 우리는 쓰지 않는다

기억법: **medium으로 채널을 묶고, source로 출처를 가르고, campaign으로 목적을 말하고, content로 변형을 나눈다.**

## 현재 등록된 조합

| 유입                 | URL 예시                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------ |
| 데일리 리마인드 알림 | `/home?utm_source=landit&utm_medium=push&utm_campaign=daily_reminder&utm_content=marco_dm` |

`utm_content`는 문구 슬러그 — 차트에서 어떤 문구인지 바로 읽히고, 문구 순서를 재배치해도 과거 데이터와 어긋나지 않는다. 어휘는 `apps/web/src/features/notification/model/reminder-copies.ts`가 단일 출처.

## 확장 예시 (미리 합의된 자리)

| 채널                 | source                | medium           | campaign 예시                   |
| -------------------- | --------------------- | ---------------- | ------------------------------- |
| 서버 푸시 (PR5 예정) | `landit`              | `push`           | `comeback_d7`, `feature_launch` |
| 홈스크린 위젯        | `landit`              | `widget`         | `streak_widget`                 |
| 카카오 공유 링크     | `kakao`               | `social`         | `result_share`                  |
| 인스타 오가닉/광고   | `instagram`           | `social` / `cpc` | `launch_event`                  |
| 이메일               | `stibee` 등 발송 도구 | `email`          | `weekly_digest`                 |

알림은 로컬/서버를 따로 나누지 않는다 — 발송 묶음은 campaign 이름이 유일하게 식별하므로 그걸로 충분하다.

## 수집 파이프라인

1. **자동 수집 (기본)** — `apps/web/src/shared/analytics/amplitude.ts`의 attribution 오토캡처가 URL의 `utm_*`를 유저 프로퍼티로 담는다. 새 채널은 URL에 딱지만 달면 끝.
2. **이벤트 프로퍼티 파생 (선택)** — 제품 퍼널 차트에서 이벤트 단위로 필요할 때만 `apps/web/src/shared/analytics/page-view.ts`에서 파생한다. 예: `utm_campaign=daily_reminder` → `Page Viewed { return_reason: 'reminder' }`. 남발하지 않는다 — 유저 프로퍼티로 충분하면 파생하지 않는다.

## 새 캠페인 추가 절차

1. 위 자리 규칙대로 URL에 `utm_*`를 붙인다 (이 문서의 "현재 등록된 조합" 표에 한 줄 추가)
2. 끝 — 자동 수집된다
3. (선택) 이벤트 프로퍼티가 필요하면 `page-view.ts`에 파생 규칙 + 테스트 추가

## 앰플리튜드에서 조회하는 법

수집이 두 갈래(이벤트 속성 / 유저 프로퍼티)라 차트도 목적별로 갈라 만든다.

**1. 알림 탭 유입 추이 — 몇 명이 알림을 눌러 들어오나**
Event Segmentation 차트 → 이벤트 `Page Viewed` → where `return_reason = reminder` → Uniques, 일별.
콜드·웜 딥링크 모두 잡히는 주 지표다.

**2. 문구별 성과 — 어떤 문구가 탭을 부르나**
위 차트에서 group by `notification_copy` → 문구 슬러그(`today_only`/`marco_dm` 등)별 비교.
슬러그↔문구 매핑은 `apps/web/src/features/notification/model/reminder-copies.ts`.

**3. 알림 유입 유저 세그먼트 — 리텐션에 효과가 있나**
Cohort 생성 → who performed `Page Viewed` where `return_reason = reminder` → 이 코호트를 Retention 차트에 얹어 전체 유저와 비교.
유저 프로퍼티로도 가능: where `utm_campaign = daily_reminder` (attribution 자동 수집분 — 콜드 유입만 확실하므로 코호트 방식을 우선).

**4. 동의 퍼널 — 어느 지면이 수락률이 좋은가**
Funnel 차트 → `Notification Consent Viewed` → `Notification Consent Accepted` → group by `source` (`home_fullscreen`/`home_sheet`/`me`).
온보딩 스텝의 수락은 기존 온보딩 퍼널(`Onboarding Step Viewed/Completed`, step=notification)로 본다.

**5. 캠페인 간 비교 (서버 푸시가 생긴 뒤)**
`Page Viewed` group by... 는 campaign 파생이 없으므로, 캠페인별 비교가 필요해지는 시점에 `page-view.ts`에 campaign 파생을 추가한다. 그 전까지는 유저 프로퍼티 `utm_campaign`으로 본다.

## 주의

- UTM은 **외부→앱 유입에만** 단다. 앱 내부 화면 이동에 붙이면 세션 어트리뷰션이 오염된다
- 표준 5개 외 커스텀 쿼리 파라미터로 유입을 표시하지 않는다 — 변형 구분은 `utm_content`로
- 값 어휘는 이 문서가 단일 출처다. 새 값을 만들면 표에 추가하고 PR에서 공유한다
