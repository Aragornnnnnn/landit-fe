# 계측 검증

기능이 나간 뒤 이벤트가 계약대로 들어오는지 본다. 계약(레포)과 실제(앰플리튜드 택소노미)를 대조하는 일이다.

## 언제

- PR이 develop에 머지되고 develop 배포가 끝났을 때 — develop 프로젝트(841482)로.
- 스토어 출시 뒤 실사용자 데이터가 쌓이기 시작했을 때 — production(841657)으로.
- "지표 이상한데" — 원인이 계측인지 데이터인지 가를 때.

## 절차

1. **대상 이벤트를 계약에서 뽑는다.** 이번 이슈가 더하거나 바꾼 이벤트만. 전체 목록이 필요하면 아래로.

   ```bash
   git fetch -q origin develop
   git show origin/develop:packages/analytics/src/events.ts | grep -E "^\s*'[A-Z][^']+':\s*(\{|undefined)" | sed -E "s/^\s*'([^']+)'.*/\1/"
   ```

   속성 계약은 같은 파일의 그 이벤트 줄과 `docs/analytics.md` 표에 있다.

2. **들어오는지 본다.** `get_amp_taxonomy action=events eventTypes=[...] fields=[name, firstSeen, lastSeen, status]`. `firstSeen`이 없으면 한 번도 안 들어온 것이다.

3. **속성이 붙는지 본다.** `get_amp_taxonomy action=properties propertyType=event eventType="<이벤트>"`. 계약에 있는데 목록에 없으면 발화 코드가 속성을 안 실은 것이다.

4. **값이 맞는지 본다.** `query_amplitude_data`로 그 이벤트를 속성으로 group_by해 분포를 뽑는다. 계약의 열거값 밖의 값, `(none)` 비율, 한 값으로 쏠림을 본다. 유저 속성은 `propertyType=user`로 `lastSeen`을 본다.

5. **판정을 네 가지로 적는다.**
   - 안 들어옴 — 발화 경로가 실행되지 않거나 SDK 초기화 전에 찍힘.
   - 계약에 없는 이벤트가 들어옴 — 오타, 또는 지운 줄 알았던 구 이벤트(구 바이너리가 아직 보내는 경우 포함).
   - 속성 누락.
   - 값 이상 — 열거값 밖, 단위 틀림, PII 섞임.

## 함정

- **`status: unexpected`는 이상이 아니다.** 트래킹 플랜에 등록 안 된 이벤트라는 뜻이고 landit은 플랜을 관리하지 않아 전부 unexpected다. 수집은 정상이다.
- **production에 배포 전 이벤트가 찍힌다.** 팀 계정이 TestFlight·로컬 빌드로 테스트한 흔적이다. `firstSeen`만으로 "실사용자에게 나갔다"고 판단하지 말고, 팀 계정 제외 세그먼트로 다시 센다. 결제 이벤트가 9/11부터 보였지만 실사용자는 9/17부터였다.
- **새 이벤트는 앱 버전이 퍼져야 늘어난다.** 출시 다음 날 수치가 작은 건 정상이다. `gp:app_version`으로 분포를 같이 본다.
- **유저 속성은 소급되지 않는다.** 속성을 붙이기 시작한 날 이전 이벤트에는 없다. "무료였던 시절 이벤트에 is_premium이 없다"는 정상이고, 설계가 그렇다(`docs/analytics.md` 유저 속성 절).
- **`Page Viewed`의 `page_name`이 경로 그대로면** 화면 이름 등록이 빠진 것이다. `apps/web/src/shared/analytics/page-view.ts`에 이름을 더한다. `page-name-coverage.test.ts`가 잡아야 했을 누락이다.
- **개발 화면(`/dev`, `/stt-demo`)과 `/`는 의도적으로 안 찍는다.** 없다고 보고하지 않는다.

## 보고 형식

이벤트별로 한 줄. 판정과 근거(firstSeen·lastSeen·속성 목록)를 같이 적는다. 고칠 것은 파일 경로까지. 정상인 것은 "정상"만.
