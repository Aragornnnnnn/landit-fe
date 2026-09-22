---
name: release
description: landit-fe 릴리즈를 낸다 — develop → main 릴리즈 PR(신규/수정/제거/메모 표, release 🚀 라벨), 머지 뒤 머지 커밋에 annotated 태그, GitHub 릴리즈 노트(Landit vX.Y.Z, 합니다체). 웹 태그 버전과 앱(app.json) 버전이 다르다는 것과 모바일 바이너리가 나가는 릴리즈의 versionCode·buildNumber 확인을 챙긴다. "릴리즈 PR 올려줘", "main에 배포", "태그 찍어줘", "릴리즈 노트 써줘", "v1.x.x 내자" 같은 요청에 사용한다. PR 생성·태그 푸시·릴리즈 생성은 각각 사용자 확인 뒤에만 한다.
---

# 릴리즈

한 번의 릴리즈는 세 단계다. 각 단계 앞에서 사용자에게 묻는다. 한 번의 "릴리즈 가자"가 셋을 다 허락한 것은 아니다.

1. 릴리즈 PR (develop → main)
2. 머지 뒤 태그
3. GitHub 릴리즈 노트

## 0. 버전을 정한다

**웹 태그 버전과 앱 버전은 다른 숫자다.** 웹은 `v1.4.x` 태그로 나가고, 앱은 `apps/mobile/app.json`의 `version`(1.3.0)·iOS `buildNumber`·Android `versionCode`로 나간다. 둘이 어긋나 있는 것이 정상이고, 섞어 쓰면 혼동이 난다. 릴리즈 노트에는 둘 다 적는다.

웹 태그는 마지막 태그(`git tag --sort=-v:refname | head -1`)에서 올린다. 기능이 들어가면 minor, 수정만이면 patch. 태그 없이 머지된 릴리즈 PR이 있으면(소급 필요) 그것부터 확인한다.

**모바일이 나가는 릴리즈인지**를 먼저 가른다. `git diff --stat main...develop -- apps/mobile packages/bridge`에 변경이 있으면 바이너리가 나간다. 그러면 세 가지를 본다.

- `app.json` `version`이 올라갔나.
- iOS `buildNumber`가 지난 스토어 제출보다 크나. 같은 번호는 App Store Connect가 거부해 버전을 올려 다시 빌드해야 한다.
- Android `versionCode`가 올라갔나. 1.3.0을 versionCode 18 그대로 냈다가 따로 올리는 PR이 필요했던 전례가 있다.

빠져 있으면 릴리즈 PR 메모에 굵게 적고, 올리는 PR을 따로 만들지 이 릴리즈에 넣을지 사용자에게 묻는다.

## 1. 릴리즈 PR

### 무엇이 들어가나

```bash
git fetch -q origin
git log --merges --oneline origin/main..origin/develop
```

머지 커밋마다 PR 번호가 나온다. `gh pr view N --json title,body,labels`로 각 PR의 내용을 읽는다. 릴리즈 PR 본문은 이 PR들의 요약이지 새로 쓰는 글이 아니다. develop에 열려 있지만 머지 안 된 PR은 들어가지 않는다는 것을 메모에 적는다.

### 제목과 본문

제목은 `release: vX.Y.Z — {이번 릴리즈를 한 줄로}`. 예: `release: v1.4.2 — 앰플리튜드 유저 속성과 결제 퍼널 계측`.

본문은 `.github` PR 템플릿을 쓰지 않는다. 표 세 개와 메모다. 비는 섹션은 뺀다.

```
## 신규

| 영역 | 변경 | 범위 | PR |
|---|---|---|---|
| 구독 | {무엇을 할 수 있게 됐나 — 사용자 관점, 결정과 그 이유까지} | 웹 | #211 |

## 수정

| 문제 | 범위 | PR |
|---|---|---|
| {어떤 증상이 어떻게 됐나} | 웹 | #245 |

## 제거

| 변경 | 범위 | PR |
|---|---|---|

## 메모

- **웹만 나가는 릴리즈다.** / **모바일 바이너리가 나가는 릴리즈다.** — 반드시 첫 줄. 모바일이면 app.json 버전·buildNumber·versionCode를 여기 적는다.
- 플래그·환경 변수 — 이 릴리즈가 켜지려면 무엇이 어떤 순서로 켜져야 하나.
- BE 의존 — 어느 BE PR이 먼저 나가야 하나. 안 나가면 뭐가 비어 보이나.
- 외부 도구 손질 — 앰플리튜드 속성·필터, Sentry, 디스코드 알림 등 릴리즈 뒤 사람이 손봐야 하는 것.
- 이 릴리즈에 안 들어간 것 — develop에 열려 있는 PR, 후속으로 뺀 것.
- 태그 — 어느 커밋에 찍을지. 소급할 태그가 있으면 여기.
```

범위는 `웹` / `모바일` / `공통`. 문체는 PR 본문과 같다 — 의도 프레이밍, 사실 서술, 전문용어 풀어 쓰기. 표 한 줄이 PR 하나를 넘어도 된다(한 기능이 두 PR이면 `#212, #213`).

### 만들기

```bash
gh pr create --base main --head develop --assignee @me --title "release: vX.Y.Z — ..." --label "release 🚀" --label "#web" --body-file /tmp/release-body.md
```

범위 라벨은 실제 바뀐 앱만. 모바일이 나가면 `#mobile`도.

머지는 사람이 한다. 머지 뒤 Vercel이 main을 프로덕션에 배포하고, `deploy-notify.yml`이 디스코드로 결과를 알린다. 이 워크플로는 머지 커밋에 태그가 있으면 릴리즈 노트 링크를 붙이므로, **태그를 배포 알림 전에 찍는 것이 좋다.** 늦으면 링크 없이 나간다. 문제는 아니다.

## 2. 태그

머지된 뒤, 머지 커밋에 annotated 태그를 찍는다. 메시지는 PR 제목.

```bash
git fetch -q origin main
MERGE=$(git log -1 --format=%H origin/main)
git tag -a vX.Y.Z -m "release: vX.Y.Z — ..." "$MERGE"
git push origin vX.Y.Z
```

찍기 전에 `git log -1 --format='%H %s' origin/main`으로 그 커밋이 정말 릴리즈 PR의 머지 커밋인지 본다. 태그 푸시는 되돌리기 번거로우니 사용자 확인 뒤에.

태그가 빠진 지난 릴리즈가 있으면 그 PR의 머지 커밋(`gh pr view N --json mergeCommit -q .mergeCommit.oid`)에 소급해서 찍는다. 날짜는 실제 찍은 날로 남는다. 괜찮다.

## 3. GitHub 릴리즈 노트

제목은 `Landit vX.Y.Z`. 본문은 릴리즈 PR을 **사용자·운영자가 읽는 글**로 다시 쓴 것이다. PR 번호 표는 여기 없다. 마지막에 PR을 가리킨다.

```
# Landit vX.Y.Z

{이번 릴리즈를 한 문장으로}합니다.

## 신규

### {영역}
- {무엇이 어떻게 됩니다 — 합니다체, 한 항목 한두 문장}

## 버그 수정
- {어떤 문제 — 어떻게 했습니다}

## 제거
- ...

## 기타
- **웹만 나가는 릴리스입니다.** 앱 바이너리 변경은 없습니다
- {외부 도구에서 새로 생기는 것, 사람이 손봐야 하는 것}

상세 내역과 PR 목록은 #N 참고.

## 플랫폼
- 웹 (Next.js) — https://www.landit.im
- iOS / Android 앱 {app.json version} (Expo WebView 셸, `com.saynow.app`) — {앱 변경 없음 / 바이너리 제출 필요}
```

```bash
gh release create vX.Y.Z --title "Landit vX.Y.Z" --notes-file /tmp/release-notes.md
```

비는 섹션은 뺀다. "기타"의 첫 줄(웹만 / 모바일 포함)은 뺄 수 없다.

## 자주 틀리는 지점

- **머지된 PR에 커밋을 더 민다.** 릴리즈 뒤 후속 수정을 옛 feat 브랜치에 밀면 어디에도 안 들어간다. `gh pr view N --json state`가 MERGED면 develop에서 새 브랜치(`fix/LAN-XX-...`)를 판다.
- **웹 태그와 앱 버전을 맞추려 한다.** 맞추지 않는다. 둘은 다른 것이다.
- **릴리즈 노트를 PR 본문 복붙으로 만든다.** PR 본문은 리뷰어용(코드 결정·의존 관계), 릴리즈 노트는 사용자·운영자용(무엇이 달라졌나). 같은 사실을 다른 독자에게 쓴다.
- **한 번의 승인으로 셋을 다 한다.** PR·태그·릴리즈는 각각 묻는다.
