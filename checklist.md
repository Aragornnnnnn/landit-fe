# landit-fe 초기 세팅 체크리스트

## 1단계: 모노레포 스캐폴딩

- [ ] 루트 설정 (package.json, pnpm-workspace.yaml, .npmrc, .gitignore, turbo.json)
- [ ] apps/web — Next.js (TypeScript, Tailwind, App Router, src 디렉토리, @/* alias)
- [ ] apps/mobile — Expo (TypeScript, expo-router)
- [ ] 루트에서 pnpm install 성공
- [ ] Prettier 루트 설정
- [ ] 검증: web 빌드 통과
- [ ] 검증: mobile 타입체크 통과
- [ ] 검증: 전체 lint 통과

## 2단계: 협업 인프라 (레포 밖 설정 포함)

- [ ] GitHub 원격 push + develop 브랜치 생성
- [ ] 브랜치 보호 규칙 (main, develop 직접 push 금지)
- [ ] GitHub Wiki 활성화 (ADR용)
- [ ] CI — GitHub Actions (lint / typecheck / build)

## 3단계: 필요해지면 (지금 안 함)

- [ ] packages/shared — 웹·모바일 공용 코드 생길 때 분리
- [ ] NativeWind — 모바일에 Tailwind 문법 쓰고 싶을 때
- [ ] TanStack Query — API 연동 시작할 때
- [ ] 테스트 세팅 (Vitest) — 핵심 로직 생길 때
- [ ] husky + lint-staged / commitlint

## 완료된 것

- [x] CONTRIBUTING.md (브랜치 전략, 커밋/PR 컨벤션)
- [x] .claude/skills/git-commit (커밋 컨벤션 스킬)
- [x] .github/PULL_REQUEST_TEMPLATE.md
