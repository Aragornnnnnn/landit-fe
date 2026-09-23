---
name: issue-start
description: landit-fe 이슈 작업을 시작할 때 매번 같은 준비를 한 번에 한다 — 이슈 번호(LAN-XX) 확인, origin/develop 기준 전용 워크트리와 feat/LAN-XX 브랜치 생성, 의존성 설치, .env.local 복사, AGENTS.md·docs/testing.md 재독, 메모리에서 관련 결정과 재론 금지 항목 찾기, 스크래치패드에 체크리스트·컨텍스트 노트. "LAN-XX 시작하자", "이슈 받았어", "새 이슈 파자", "워크트리 만들어줘", "브랜치 파줘", "이 작업 시작해줘" 같은 요청에 사용한다. 이슈 번호 없이 브랜치를 먼저 만들지 않는다.
---

# 이슈 시작

매 이슈의 첫 10분은 같은 일이다. 그런데 그때마다 빠뜨린 것이 사고가 됐다 — 옛 브랜치 스냅샷의 AGENTS.md를 믿고 TDD 조항을 놓쳤고, 브랜치를 전환했다가 다른 세션의 작업과 섞였고, `node_modules` 없는 워크트리에서 커밋 훅이 조용히 안 돌아 포맷 안 맞은 커밋이 CI를 깨뜨렸다. 이 스킬은 그 목록이다.

## 1. 이슈 번호와 내용

- **번호(LAN-XX)가 없으면 묻는다.** 브랜치명이 번호로 정해지므로 번호 없이 브랜치를 먼저 파지 않는다. 급하면 구현 논의는 진행하되 브랜치는 번호를 받은 뒤에.
- **이슈 내용.** 노션 MCP가 인증돼 있으면 읽는다. 아니면 사용자에게 요구사항·완료 기준을 붙여 달라고 한다. 이슈 없이 "대충 이런 거"로 시작하면 완료 기준이 없어 끝이 안 난다.
- 제목은 그대로 적어 둔다. PR 제목이 된다.

## 2. 워크트리

브랜치 전환이 아니라 **워크트리**다. 세션이 여럿이라 한 폴더에서 브랜치를 바꾸면 남의 작업 위에 커밋한다. 실제로 그랬다.

```bash
git -C ~/Developer/landit-fe fetch -q origin
git -C ~/Developer/landit-fe worktree add ../landit-fe-lanXXX -b feat/LAN-XXX origin/develop
```

- 폴더는 `~/Developer/landit-fe-lanXXX`, 브랜치는 `feat/LAN-XXX`. 버그 수정도 팀 규칙상 `feat/`가 아니라 `fix/LAN-XXX`를 써도 된다. 이슈 성격을 따른다.
- base는 `origin/develop`. 앞 PR 위에 쌓는 스택이면 base를 그 브랜치로 하되, 사용자가 스택을 원하는지 먼저 확인한다(스택 PR을 기피한 전례가 있다).
- 이미 같은 폴더가 있으면(`git worktree list`) 새로 만들지 말고 그 상태를 본다. `git status`에 미커밋 변경이 있으면 남의 WIP일 수 있다. 건드리지 않고 사용자에게 알린다.
- 워크트리끼리 `.git/info/exclude`를 공유한다. 로컬 전용 파일(`checklist.md`, `dev-*` 라우트, `proxy.ts`)은 이미 거기 등록돼 있다. 새 로컬 전용 파일을 만들면 거기 추가한다.

## 3. 설치와 환경

```bash
cd ~/Developer/landit-fe-lanXXX
pnpm install --offline --frozen-lockfile || pnpm install --frozen-lockfile
cp ~/Developer/landit-fe/apps/web/.env.local apps/web/.env.local
```

- `pnpm install`을 건너뛰면 husky의 prettier 훅이 안 돌아 포맷 안 맞은 커밋이 그대로 올라간다. 문서만 고치는 이슈여도 한다.
- `.env.local`은 gitignore라 새 워크트리에 없다. 메인 워크트리 것을 복사한다. dev BE 주소, 소셜 로그인 키, dev 로그인·MSW 플래그가 들어 있다. `apps/mobile`은 필요할 때만.
- dev 서버 포트는 이슈마다 다르게 잡는다(3000은 실제 OAuth 리다이렉트용이라 로그인이 필요한 이슈에만). 브라우저 패널로 볼 거면 `.claude/launch.json`(로컬 전용)에 항목을 더한다.

```json
{ "name": "web-lanXXX", "runtimeExecutable": "pnpm", "runtimeArgs": ["-C", "/Users/junseo/Developer/landit-fe-lanXXX", "--filter", "web", "exec", "next", "dev", "-p", "31XX"], "port": 31XX }
```

## 4. 규칙을 다시 읽는다

세션 시작 때 읽은 AGENTS.md는 그때 열려 있던 폴더의 것이다. 새 워크트리는 develop 최신이라 조항이 다를 수 있다. **바뀐 파일이 속한 문서를 워크트리에서 다시 연다.**

- `AGENTS.md`(루트) — 모노레포 공통, TDD 기본값, 수동 메모이제이션 금지
- `apps/web/AGENTS.md` — 3층 배치, 이름 규칙, import 방향
- `apps/mobile/AGENTS.md` — OTA runtimeVersion, 위젯 규칙
- `docs/testing.md` — 테스트 규칙 (`test` 스킬이 절차로 풀어 둔 것)
- 이슈가 건드리는 영역의 `docs/*.md` — analytics, bridge, subscription, widget, monitoring

## 5. 메모리에서 결정을 찾는다

같은 영역을 전에 건드렸으면 결정이 메모리에 있다. 특히 **"재론 금지"**로 표시된 결정은 다시 열지 않는다. 사용자가 이미 정한 것이다.

```bash
ROOT=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")   # 워크트리여도 메인 체크아웃 경로
grep -i "키워드" ~/.claude/projects/$(echo "$ROOT" | tr '/' '-')/memory/MEMORY.md
```

메모리 폴더 이름은 메인 체크아웃 경로의 `/`를 `-`로 바꾼 것이다. 워크트리에서는 경로가 다르므로 공통 git 디렉토리에서 메인 경로를 구한다.

키워드는 이슈의 영역 이름(페이월, 발음, 위젯, 스트릭 …)과 파일 이름. 걸린 메모리 파일을 열어 "How to apply"와 잔여 항목을 읽는다. 지난 이슈의 "잔여"가 이번 이슈일 때가 많다.

## 6. 작업 문서

스크래치패드에 둘을 만든다. **레포에 커밋하지 않는다.**

- `checklist.md` — 완료 기준을 체크박스로. 이슈의 완료 기준을 그대로 옮기고, 구현하며 쪼갠다.
- `context-notes.md` — 결정과 이유. 사용자가 정한 것, 내가 가정한 것, 막힌 것. 다음 세션이 이걸로 이어받는다.

## 7. 시작 보고

준비가 끝나면 한 번에 알린다. 워크트리 경로·브랜치·base, 읽은 문서에서 이번 이슈에 걸리는 규칙, 메모리에서 찾은 관련 결정과 잔여, 이슈 내용에서 모호한 것. 모호한 것은 여기서 묻는다. 구현 중에 묻는 것보다 싸다.

그다음은 `test` 스킬(테스트 먼저) → 구현 → `code-quality` → `pr` 순서다.

## 자주 틀리는 지점

- **번호 없이 브랜치를 판다.** `feat/sentry`처럼 이름으로 팠다가 지적받았다. 번호부터.
- **메인 폴더에서 브랜치를 바꾼다.** 워크트리를 쓴다. 메인 폴더(`~/Developer/landit-fe`)는 다른 세션이 쓰고 있을 수 있다.
- **설치를 건너뛴다.** 훅이 안 돈다. CI가 포맷에서 깨진다.
- **옛 AGENTS.md를 믿는다.** 워크트리에서 다시 읽는다.
- **재론 금지 결정을 다시 제안한다.** 메모리에 그렇게 적혀 있으면 그 이유까지 읽고 넘어간다.
