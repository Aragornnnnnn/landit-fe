# landit-fe 컨텍스트 노트

작업 중 내린 결정과 이유. 다음 세션(사람이든 에이전트든)이 재논의 없이 이어갈 수 있도록 기록한다.

## 2026-07-04 초기 세팅

- **모노레포 확정** — 웹(Next.js)과 모바일(React Native)을 한 레포에 담는다. 커밋 scope도 `web` | `mobile`로 이미 정의되어 있음.
- **모바일은 Expo** — 빌드/배포 관리형, 팀 온보딩 쉬움. 네이티브 기능 필요 시 expo-dev-client로 커버.
- **웹 스타일링은 Tailwind CSS** — 팀 커밋 컨벤션 예시에 Tailwind v4 언급이 있어 팀 방향과 일치.
- **pnpm workspace + Turborepo** — 사용자가 두 도구를 잘 몰랐으나 Expo 공식 지원 확인 후 채택. Turborepo는 turbo.json 하나 추가되는 수준.
- **.npmrc에 node-linker=hoisted** — React Native 툴체인이 pnpm의 심볼릭 링크 방식 node_modules와 궁합이 나빠서, Expo 공식 문서가 권장하는 hoisted 방식 사용.
- **packages/shared는 만들지 않음** — 공용 코드가 실제로 생길 때 분리 (추측성 구조 금지).
- **테스트/husky/commitlint 미도입** — 코드가 없는 시점이라 보류. checklist 3단계 참고.
- **이슈는 노션 관리 (LAN-XX)** — GitHub Issues 안 씀. 브랜치명 `feat/LAN-10` 형식.
- **초기 세팅 커밋은 main 직접 커밋** — develop 브랜치와 보호 규칙이 아직 없는 부트스트랩 단계라서. 원격 push 후부터는 브랜치 전략 준수. → 이후 사용자 피드백으로 철회: main을 initial commit으로 되돌리고 `feat/LAN-35`에서 작업, develop으로 PR 예정.
- **RN 앱은 WebView 셸(껍데기)로 사용** — 네이티브 UI를 만들지 않고 웹(Next.js)을 WebView로 감싸는 하이브리드 구조. 실제 제품 UI는 전부 web에 산다. 셸 전환(react-native-webview + 브릿지)은 LAN-35가 아닌 별도 이슈로 진행.
- **공유 패키지 1순위는 packages/bridge** — WebView postMessage 브릿지의 메시지 타입 정의를 web/mobile이 공유. 셸 이슈 때 같이 설계.
- **apps/mobile은 사용자가 직접 생성** — create-expo-app 기본 템플릿(SDK 57). 세팅 이슈에서는 템플릿 그대로 커밋하고 예제 코드 제거는 셸 이슈에서.
- **모바일은 기존 레포의 앱을 이어받음** — 기존 레포에 Android가 이미 배포되어 있음. 같은 앱으로 업데이트를 이어가려면 패키지명과 서명 키를 반드시 동일하게 유지해야 함. 이관은 별도 이슈로 진행 (checklist 3단계).
- **EAS Build(iOS/Android 스토어 빌드) 설정은 나중에** — 스토어에 올릴 실물이 생겼을 때 별도 이슈로.
- **expo-env.d.ts는 gitignore 대상이지만 강제 추적(git add -f)** — Expo CLI가 자동 생성하는 파일이라 공식적으로는 ignore 권장이지만, 커밋 안 하면 fresh clone/CI에서 typecheck가 깨짐. Expo가 생성하는 내용과 바이트 단위로 동일하게 커밋해서 재생성 시 diff가 안 생기게 함.
