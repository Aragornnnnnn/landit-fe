# landit-fe 프로젝트 환경 세팅 계획

웹(Next.js)과 모바일(React Native)을 한 레포에 담는 FE 모노레포의 초기 환경을 구축한다.
이슈: LAN-35 (개발환경 세팅) / 브랜치: `feat/LAN-35` → `develop` PR

## 확정된 기술 스택

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 웹 | Next.js (App Router, TypeScript) | SSR/SEO, 팀 커밋 컨벤션에 이미 명시 |
| 모바일 | Expo (React Native, TypeScript) | 관리형 빌드/배포, 팀 온보딩 용이 |
| 스타일링 | Tailwind CSS (웹) | 커밋 컨벤션 예시에 Tailwind v4 언급, 팀 방향과 일치 |
| 패키지 매니저 | pnpm 10 (workspace) | 빠르고 디스크 효율적, 모노레포 표준 |
| 태스크 러너 | Turborepo | 병렬 실행 + 캐싱, turbo.json 하나로 도입 가능 |
| 포매터 | Prettier | 루트 단일 설정으로 웹/모바일 공통 적용 |

## 레포 구조

```
landit-fe/
├── apps/
│   ├── web/          # Next.js (커밋 scope: web)
│   └── mobile/       # Expo (커밋 scope: mobile)
├── packages/         # 공용 코드 생기면 그때 추가 (지금은 비움)
├── pnpm-workspace.yaml
├── turbo.json
├── .npmrc            # node-linker=hoisted (RN 호환)
├── CONTRIBUTING.md   # 브랜치/커밋/PR 컨벤션
└── .github/PULL_REQUEST_TEMPLATE.md
```

## 단계별 계획

각 단계는 검증 기준을 통과해야 다음으로 넘어간다.

### 0단계: 브랜치 정리 — 완료

- main/develop을 initial commit 기준으로 정리, 작업은 `feat/LAN-35`에서 진행
- 검증: `git log --all`로 브랜치 상태 확인 ✅

### 1단계: 모노레포 루트 설정 — 파일 생성 완료, 검증 남음

- package.json, pnpm-workspace.yaml, turbo.json, .npmrc, .prettierrc, .gitignore
- turbo + prettier 루트 devDependency 설치
- 검증: `pnpm install` 성공

### 2단계: 웹 앱 (apps/web) — 생성 완료, 검증 남음

- create-next-app: TypeScript, Tailwind, App Router, src 디렉토리, `@/*` alias
- typecheck 스크립트 추가 (`tsc --noEmit`)
- 검증: `pnpm --filter web build` 성공

### 3단계: 모바일 앱 (apps/mobile)

- create-expo-app: 기본 템플릿 (TypeScript, expo-router)
- typecheck 스크립트 추가
- 검증: `pnpm --filter mobile typecheck` + `npx expo-doctor` 통과

### 4단계: 통합 검증

- 루트에서 `pnpm lint`, `pnpm typecheck`, `pnpm build` 전부 통과 (turbo 경유)
- README.md에 실행 방법 문서화 (dev 서버 켜는 법, 폴더 구조)

### 5단계: 원격 연동 (GitHub 설정 필요)

- 원격 push (main, develop, feat/LAN-35)
- `feat/LAN-35` → `develop` PR 생성, 팀 리뷰
- 브랜치 보호 규칙: main/develop 직접 push 금지, PR 필수
- Wiki 활성화 (ADR용)
- CI: GitHub Actions — PR마다 lint / typecheck / build

## 커밋 계획 (feat/LAN-35 위에서)

스캐폴딩은 자동 생성 코드라 30줄 룰 대신 논리 단위로 쪼갠다.

1. `docs: 팀 그라운드 룰을 CONTRIBUTING.md와 커밋 스킬, PR 템플릿으로 문서화` — 완료
2. `docs: 초기 세팅 계획, 체크리스트, 컨텍스트 노트 추가`
3. `chore: pnpm workspace + Turborepo 모노레포 루트 설정`
4. `chore(web): create-next-app으로 Next.js 앱 스캐폴딩 (TypeScript, Tailwind)`
5. `chore(mobile): create-expo-app으로 Expo 앱 스캐폴딩`

## 지금 하지 않는 것 (필요해지면 도입)

- packages/shared — 웹·모바일 공용 코드가 실제로 생길 때
- NativeWind — 모바일에 Tailwind 문법이 필요해질 때
- TanStack Query / Zustand — API 연동 시작할 때
- 테스트 (Vitest) — 핵심 로직이 생길 때
- husky + lint-staged / commitlint — 팀이 필요성을 느낄 때
