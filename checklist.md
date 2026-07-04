# landit-fe 초기 세팅 체크리스트

## 1단계: 모노레포 스캐폴딩 — 완료

- [x] 루트 설정 (package.json, pnpm-workspace.yaml, .npmrc, .gitignore, turbo.json)
- [x] apps/web — Next.js (TypeScript, Tailwind, App Router, src 디렉토리, @/* alias)
- [x] apps/mobile — Expo (TypeScript, expo-router) + ESLint 설정
- [x] 루트에서 pnpm install 성공
- [x] Prettier 루트 설정
- [x] 검증: web 빌드 통과
- [x] 검증: mobile 타입체크 + expo-doctor 통과
- [x] 검증: 전체 lint / typecheck / build 통과 (turbo 경유)
- [x] README 실행 방법 문서화

## 2단계: 협업 인프라 (레포 밖 설정 포함)

- [ ] GitHub 원격 push + develop 브랜치 생성
- [ ] feat/LAN-35 → develop PR 생성, 팀 리뷰
- [ ] 브랜치 보호 규칙 (main, develop 직접 push 금지)
- [ ] GitHub Wiki 활성화 (ADR용)
- [ ] CI — GitHub Actions (lint / typecheck / build)

## 3단계: 별도 이슈로 진행할 것

- [ ] **기존 앱 이관** — 기존 레포에서 Android가 이미 배포되어 있음. 패키지명(applicationId) 동일 유지, 서명 키(keystore) 이관, versionCode 이어가기, EAS 프로젝트/OTA 채널 연결, app.json 설정 대조
- [ ] **WebView 셸 전환** — RN 앱을 웹뷰 껍데기로. react-native-webview + 템플릿 예제 코드 제거 + packages/bridge (postMessage 메시지 타입 공유) 설계. Apple 심사 4.2 대응으로 네이티브 기능(푸시, 마이크 권한 등) 포함
- [ ] **EAS Build 설정** — iOS/Android 스토어 빌드. 스토어에 올릴 실물이 생겼을 때
- [ ] packages/shared — 웹·모바일 공용 코드 생길 때 분리
- [ ] NativeWind — 모바일에 Tailwind 문법 쓰고 싶을 때
- [ ] TanStack Query — API 연동 시작할 때
- [ ] 테스트 세팅 (Vitest) — 핵심 로직 생길 때
- [ ] husky + lint-staged / commitlint

## 완료된 것 (1단계 이전)

- [x] CONTRIBUTING.md (브랜치 전략, 커밋/PR 컨벤션)
- [x] .claude/skills/git-commit (커밋 컨벤션 스킬)
- [x] .github/PULL_REQUEST_TEMPLATE.md
- [x] 브랜치 정리 (main/develop/feat/LAN-35)
