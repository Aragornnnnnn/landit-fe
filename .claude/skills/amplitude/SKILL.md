---
name: amplitude
description: landit 앰플리튜드(제품 분석) 작업 — 계측 검증(이벤트가 계약대로 찍히는지), 지표 분석(전환율·퍼널·리텐션·유입 조회), 대시보드 관리(차트 만들기·고치기·정리·한도). "지표 잘 찍히나 봐줘", "결제 전환율 얼마야", "9/17 이후 리텐션", "차트 정리해줘", "대시보드 만들어줘", "앰플리튜드에서 확인해줘" 같은 요청에 사용한다. 차트·대시보드를 저장하는 단계는 무료 플랜 한도를 소모하므로 사용자 확인 뒤에만 한다.
---

# 앰플리튜드

세 갈래다. 요청 문장으로 가른다.

| 요청                                            | 갈래      | 절차                                               |
| ----------------------------------------------- | --------- | -------------------------------------------------- |
| "찍히나", "들어오나", "계측 확인", 배포 뒤 점검 | 계측 검증 | [references/verify.md](references/verify.md)       |
| "얼마야", "몇 명", "전환율", "추이", "비교"     | 지표 분석 | [references/analyze.md](references/analyze.md)     |
| "차트", "대시보드", "정리", "한도"              | 대시보드  | [references/dashboard.md](references/dashboard.md) |

어느 갈래든 아래 공통 사실 위에서 돈다. 여기 없는 값은 도구로 확인하고, 확인한 값이 여기와 다르면 이 문서를 고친다.

## 어디를 보는가

- 조직 `twilight-wind-527959`(id 449674), 플랜 `starter_v4`(무료).
- 프로젝트 — **production `841657`**, **develop `841482`**. 로컬·프리뷰·develop 배포는 dev 키를 쓰므로 배포 전 검증은 develop, 실사용자 수치는 production이다.
- 계약 정본은 레포다. `packages/analytics/src/events.ts`(이벤트·속성 타입), `docs/analytics.md`(이벤트 표·유저 속성·시점), `docs/analytics-utm.md`(유입 딱지 어휘). **작업 브랜치의 사본이 아니라 원격 ref로 읽는다** — 지표 설계·develop 검증은 `origin/develop`, production 검증은 배포된 `origin/main`. `git fetch -q origin develop main && git show origin/develop:docs/analytics.md`. 작업 브랜치의 사본은 낡아 있을 수 있다(결제 이벤트가 없는 브랜치에서 결제 지표를 찾은 적이 있다).
- 이벤트·속성 이름은 절대 추측하지 않는다. 계약 파일이나 `get_amp_taxonomy`로 철자를 확인한 뒤 쓴다. 틀린 이름은 에러가 아니라 빈 차트로 돌아온다.

## 표준 조건

모든 고객 행동 지표에 기본으로 건다. 빼야 하면 이유를 적는다.

- **팀 계정 제외** — `user_id is not` 아래 24개. 랜딧 팀이 테스트로 남긴 이벤트라 배포 전에도 production에 찍힌다.

  ```
  1 2 3 4 5 7 11 12 34 35 36 37 38 39 172 297 327 465 467 470 476 477 480 509
  ```

- **외부 모바일 사용자** — 위 제외 + `gp:platform is ios, android`. 브라우저 유입(platform web, app_version 없음)은 앱 지표를 흐리므로 뺀다.
- **무료 / 유료** — 유저 속성 `is_premium` `true` / `false`. 세그먼트 둘을 한 차트에 얹는다(차트를 둘로 쪼개지 않는다). 소급되지 않으므로 2026-09-11 이전 이벤트와 로그인 전 이벤트에는 값이 없다. `subscription_state`(unknown|none|trial|active|canceled), `plan`(monthly|yearly)도 같은 통로로 온다.
- **앱 버전** — 유저 속성 `app_version`. 결제·페이월·레벨 결과처럼 특정 버전에만 있는 지표는 그 버전으로 세그먼트를 걸어야 분모가 맞다. 스토어 업데이트는 며칠에 걸쳐 퍼지므로 "출시일 이후"만 자르면 구버전 사용자가 섞인다.

## 기산일

이 날짜 전의 데이터는 없거나 다른 뜻이다. 차트 기간을 잡을 때 참고한다.

| 날짜 (KST) | 일어난 일                                                                          |
| ---------- | ---------------------------------------------------------------------------------- |
| 2026-07-17 | 계측 시작                                                                          |
| 2026-08-08 | 알림 동의(Notification Consent) 이벤트                                             |
| 2026-08-18 | 대화 이벤트가 Scenario Talk / Small Talk로 갈림 (구 Conversation 계열은 이후 빈다) |
| 2026-08-20 | 리텐션 전략 적용 — 리텐션 차트 기준일                                              |
| 2026-08-25 | 온보딩 level 스텝                                                                  |
| 2026-09-07 | 위젯 설치 이벤트                                                                   |
| 2026-09-11 | 결제·페이월 이벤트와 프리미엄 유저 속성 (9/16까지는 팀 테스트)                     |
| 2026-09-17 | 1.3.0(결제) 실사용자 출시. 1.3.0 사용자는 9/18부터 유의미하게 늘었다               |

온보딩 스텝은 현재 9개다 — intro → sound → mic → thought → notification → widget → level → accent → scenario. 옛 차트는 6개만 본다.

## MCP 함정

- **차트 검색은 항상 0건이다.** `search_amp_entities`에 CHART를 넣어도 저장 차트가 안 나온다(`includeArchived`·`includeGenerated`를 켜면 대시보드까지 0건). 차트 목록은 대시보드를 `use_amp_dashboards get`으로 읽어 `chartIds`로 역추적한다. 존재 확인은 `get_amplitude_charts include=link`(전부 검증된다), 정의는 `include=definition`(일부가 null로 와도 링크 모드에선 살아 있다).
- **유저 속성은 차트 정의에서 `gp:` 접두사다.** group_by·filter에 `app_version`이라고 쓰면 "display name" 에러다. `gp:app_version`, `gp:platform`으로 쓴다. `user_id`·`is_premium`은 그대로다.
- **기간 시작은 epoch 초로 넣고, 계산은 셸에 맡긴다.** `TZ=Asia/Seoul date -j -f '%Y-%m-%d %H:%M' '2026-09-17 00:00' +%s`. 손으로 계산해 미래 시각을 넣으면 "Start date cannot be greater than end date"다. `end` 없이 `start`만 주면 "Since" 차트가 되어 날짜가 굴러가도 시작점이 고정된다.
- **`query_amplitude_data`는 저장하지 않는다.** 결과의 `chartEditId`는 임시다. 대시보드 rows에 그 id를 넣는 순간 영구 차트로 저장되어 한도를 먹는다.
- **코호트는 쓰지 않는다.** 무료 플랜 제한에 걸릴 수 있다. "알림 유입 있는 사용자" 같은 집단은 차트 세그먼트의 행동 조건(performed `Page Viewed` where `entry_campaign is set`)으로 만든다.

## 한도

- 무료 플랜은 **저장 차트 20개**(조직 전체). 대시보드 개수는 제한이 없고, 대시보드를 지워도 차트는 남아 한도가 줄지 않는다.
- 삭제는 **보관 뒤에만** 메뉴에 나타난다. MCP에는 삭제·보관이 없어 화면에서 사람이 한다.
- 같은 지표를 기간·세그먼트만 바꿔 두 번 저장하지 않는다. 기간은 대시보드 상단 날짜 선택으로, 집단은 세그먼트로 가른다.

## 보고

- 숫자는 조건과 같이 준다 — 기간, 세그먼트, 제외 여부. 조건 없는 숫자는 다음 사람이 재현할 수 없다.
- 새로 안 사실(이벤트가 어느 날부터 들어왔는지, 어떤 속성이 비어 있는지)은 이 문서의 기산일·함정 표에 보탠다.
