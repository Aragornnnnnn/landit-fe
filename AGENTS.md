# landit-fe 에이전트 가이드

landit 프론트엔드 모노레포. 웹(Next.js)과 모바일(Expo/React Native)을 한 레포에서 관리한다.

## 구조와 아키텍처

- `apps/web` — Next.js 16 (TypeScript, Tailwind v4, App Router). **실제 제품 UI는 전부 여기 산다.**
- `apps/mobile` — Expo SDK 57 (TypeScript, expo-router). **WebView 셸(껍데기) 방향** — 네이티브 UI를 만들지 않고 web을 WebView로 감싼다. 셸 전환은 별도 이슈로 진행 예정.
- `packages/` — 공용 코드가 생길 때 분리. 1순위는 WebView postMessage 브릿지 타입을 공유하는 `packages/bridge` (예정).
- 모바일은 기존 레포(saynow-fe)에서 배포 중인 iOS/Android 앱을 이어받는다. **Android는 패키지명(applicationId)과 서명 키, iOS는 Bundle Identifier를 반드시 동일하게 유지해야 한다.**

## 명령어

```bash
pnpm install                # 루트에서 한 번 (Node 20.9+, pnpm 10)
pnpm --filter web dev       # 웹 dev 서버
pnpm --filter mobile start  # Expo dev 서버
pnpm lint / typecheck / build / format   # 루트에서 turbo 경유 전체 실행
```

## 컨벤션

- 브랜치·커밋·PR 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md) 참고. 커밋 형식은 `{type}({scope}): 한국어 메시지`, scope는 `web` | `mobile` | 생략(공통).
- 이슈는 노션에서 관리한다 (`LAN-XX`). 브랜치명은 `feat/LAN-XX`.
- `main`, `develop`에 직접 커밋하지 않는다. feature 브랜치에서 작업 후 develop으로 PR.
- 포맷팅·import 순서는 Prettier가 자동 처리한다 (`.prettierrc`). 수동으로 정렬하지 말 것.

## 주의사항

- `.npmrc`의 `node-linker=hoisted`는 React Native 툴체인 호환용. 제거하면 mobile이 깨진다.
- `expo-env.d.ts`, `next-env.d.ts`는 툴이 생성한 원본 그대로 커밋한다. 포맷하거나 수정하지 말 것 (Prettier ignore 처리됨).
- 앱별 추가 규칙은 `apps/web/AGENTS.md`, `apps/mobile/AGENTS.md` 참고.
