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
- **초기 세팅 커밋은 main 직접 커밋** — develop 브랜치와 보호 규칙이 아직 없는 부트스트랩 단계라서. 원격 push 후부터는 브랜치 전략 준수.
