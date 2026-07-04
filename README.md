# landit-fe

landit 프론트엔드 모노레포. 웹(Next.js)과 모바일(Expo/React Native)을 한 레포에서 관리한다.

## 구조

```
landit-fe/
├── apps/
│   ├── web/        # Next.js 16 (TypeScript, Tailwind CSS, App Router)
│   └── mobile/     # Expo SDK 57 (TypeScript, expo-router)
├── packages/       # 웹·모바일 공용 패키지 (필요 시 추가)
├── pnpm-workspace.yaml
└── turbo.json      # Turborepo 태스크 설정
```

## 요구사항

- Node.js 20 이상
- pnpm 10 (`npm install -g pnpm`)

## 시작하기

```bash
pnpm install          # 루트에서 한 번, 전체 앱 의존성 설치

pnpm --filter web dev       # 웹 dev 서버 (http://localhost:3000)
pnpm --filter mobile start  # 모바일 (Expo dev 서버, QR로 Expo Go 연결)
```

## 전체 검사

루트에서 실행하면 turbo가 모든 앱에 병렬로 돌리고, 변경 없는 앱은 캐시로 건너뛴다.

```bash
pnpm lint         # ESLint (web + mobile)
pnpm typecheck    # tsc --noEmit (web + mobile)
pnpm build        # 프로덕션 빌드 (web)
pnpm format       # Prettier 전체 포맷
```

## 컨벤션

브랜치 전략, 커밋/PR 컨벤션은 [CONTRIBUTING.md](CONTRIBUTING.md) 참고. 이슈는 노션에서 관리한다 (`LAN-XX`).
