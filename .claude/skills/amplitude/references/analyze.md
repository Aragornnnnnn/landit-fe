# 지표 분석

질문을 받으면 조건을 되묻지 않고 표준 조건으로 바로 조회한다. 조건을 바꿔야 할 때만 묻는다.

## 절차

1. **질문을 이벤트로 옮긴다.** 이벤트명은 SKILL.md의 정본에서 확인한다. 같은 행동이 버전에 따라 다른 이벤트인 경우가 있다(8/18 이전 `Conversation Completed` → 이후 `Scenario Talk Completed` / `Small Talk Completed`).
2. **조건을 정한다.** 팀 계정 제외는 기본. 앱 지표면 외부 모바일. 결제·페이월·레벨 결과는 `gp:app_version` 1.3.0 이상. 무료/유료 비교는 `is_premium` 세그먼트 둘.
3. **기간을 정한다.** 질문에 없으면 기산일 표를 보고 그 지표가 뜻을 갖는 첫날부터. 시작 epoch는 셸로 계산한다.
4. **`query_amplitude_data`로 조회한다.** `projectId` 필수(production 841657). 결과 확인용 조회는 저장되지 않으므로 마음껏 돌린다.
5. **보고한다.** 숫자·기간·세그먼트·제외 여부를 같이. 해석은 한 줄.

## 차트 모양 (typed `chart`)

세그먼트 조건은 `segments[].where`에, 이벤트 속성 필터는 `events[].where`에, 유저 속성 group_by는 `gp:` 접두사로.

```json
{
  "kind": "segmentation",
  "name": "9/17 이후 활성 유저 앱 버전 분포",
  "events": [
    {
      "event": "_active",
      "group_by": [{ "property": "gp:app_version", "scope": "user" }]
    }
  ],
  "segments": [
    {
      "where": [
        {
          "property": "gp:platform",
          "scope": "user",
          "op": "is",
          "values": ["ios", "android"]
        },
        {
          "property": "user_id",
          "scope": "user",
          "op": "is not",
          "values": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "7",
            "11",
            "12",
            "34",
            "35",
            "36",
            "37",
            "38",
            "39",
            "172",
            "297",
            "327",
            "465",
            "467",
            "470",
            "476",
            "477",
            "480",
            "509"
          ]
        }
      ]
    }
  ],
  "measured_as": { "as": "unique_users" },
  "interval": "day",
  "date_range": { "start": 1789570800, "timezone": "Asia/Seoul" }
}
```

퍼널은 `kind: funnel`, `steps`, `conversion_window`(대화 흐름은 24시간, 로그인은 1시간). 리텐션은 `kind: retention`, `start_event: "_new"`, `return_events`, `retention_method`(nday 또는 rolling).

무료/유료 나란히 보기는 `segments`를 둘 넣는다 — `is_premium is true`, `is_premium is false`. 각 세그먼트에 팀 계정 제외를 반복한다.

## 자주 묻는 질문과 정의

- **페이월 전환율** — 퍼널 `Page Viewed`(page_name paywall) → `Purchase Started` → `Purchase Completed`. `paywall_source`로 group_by하면 어느 문(expression·smalltalk·conversation_finished·feedback_detail·me)이 사는지 나온다. 세그먼트 1.3.0 이상.
- **페이월 도달률** — 퍼널 `Scenario Talk Started` → turn_index 0 `Scenario Talk Turn Completed` → `Scenario Talk Completed` → `Feedback Viewed` → `Level Result Viewed` → `Prepared Learning Viewed` → `Prepared Learning Continued` → `Paywall Gate Locked`. 첫 시나리오에서만 이 흐름이다.
- **결제 결과** — `Purchase Completed` / `Purchase Canceled` / `Purchase Failed` 세 이벤트 일별, `plan` group_by. 실패는 `reason`(browser·outdated_shell·no_response·shell_error)으로 갈라 본다. `unlocked=false` 비율은 웹훅 지연 신호다.
- **해지** — `Cancel Reason Selected` reason별, `Store Subscription Tapped` action=cancel.
- **알림·위젯 유입** — `Page Viewed` where `entry_campaign is set`, `entry_campaign` group_by. 알림 캠페인 네 개(daily_scenario_reminder·continue_expression·small_talk_reminder·mailbox_reply)와 위젯(streak_widget)이 한 차트에 나온다. 유저 속성 `utm_*`는 콜드 스타트만 잡으므로 이벤트 속성을 쓴다.
- **위젯 설치** — 퍼널 `Widget Install Invite Viewed` → `Widget Install Invite Answered`(answer yes) → `Widget Pin Requested` → `Widget Installed`. platform별.
- **알림 동의** — 퍼널 `Notification Consent Viewed` → `Notification Consent Accepted` → `Notification Permission Decided`(granted true). source별.
- **표현 학습 완주** — 퍼널 `Expression Learning Started` → `Quiz Answer Submitted` → `Expression Step Viewed`(step explain) → `Review Answer Submitted` → `Expression Completed`. 발음 스텝은 발음 없는 표현에서 건너뛰므로 이 퍼널에 넣지 않고 따로 본다(`Expression Step Viewed` step pronounce → `Pronunciation Result Viewed`).
- **리텐션** — 신규 N-day는 `_new` → `_active`, 외부 모바일, 8/20 이후. 대화 리텐션은 `_new` → `Conversation Start Tapped`, 주간.

## 해석할 때

- 출시 직후 1.3.0 지표는 분모가 작다. 며칠 모아서 본다.
- 브라우저(platform web) 사용자는 결제·위젯이 없다. 섞이면 전환율이 내려간다.
- 옛 이벤트명(Conversation Completed 등)을 보는 차트는 8/18 이후 빈다. 0이 아니라 이름이 바뀐 것이다.
