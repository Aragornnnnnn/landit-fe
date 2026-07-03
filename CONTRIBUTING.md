# Contributing Guide

landit-fe 개발 그라운드 룰. 아키텍처 레벨 결정(ADR)은 [GitHub Wiki](../../wiki)에, 코드 레벨 논의는 PR에 정리한다.

## 그라운드 룰

- 개발 내용은 사람이 직접 검토한다.
- 문서화 내용은 사람이 한 번 검토한다.
- GitHub Wiki에 ADR 문서로 정리한다.
  - Wiki: 아키텍처 레벨에 대한 내용
  - PR: 코드 레벨에 대한 내용

## 코드 컨벤션

[Google Style Guide](https://google.github.io/styleguide/)를 참고한다.

- 네이밍은 길어도 괜찮으니 직관적으로 작성한다.
- 하나의 메서드는 하나의 책임과 기능만 갖는다. (최대 20줄, 파라미터 최대 3~4개)
- 메서드 설명은 `/**` (JSDoc), 메서드 내부 주석은 `//`

## 브랜치 전략

| 브랜치 | 용도 |
| --- | --- |
| `main` | 기준 브랜치. 제품을 배포하는 브랜치 |
| `develop` | 개발 브랜치. 각자 작업한 기능을 여기로 Merge |
| `feat/{이슈번호}` | 단위 기능 개발. 완료되면 `develop`에 Merge |
| `release` | `main`으로 보내기 전 QA(품질검사)용 브랜치 |
| `hotfix` | `main` 배포 후 발생한 버그 긴급 수정 |

- 브랜치 이름에 노션 이슈 번호를 적는다. 예시: `feat/LAN-10`

## 커밋 컨벤션

형식: `{type}({scope}): 커밋 메시지`

- **scope**: `mobile` (React Native) | `web` (Next.js) | 생략 가능 (공통 변경)
- **message**: "무엇을" + "왜/어떻게"를 한국어로. 단순 나열 금지.
- 커밋은 1개 30줄 이내를 권장한다.

| Tag | 설명 |
| --- | --- |
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| design | 사용자에게 보이는 UI 시각적 변경 (레이아웃, 색상, 컴포넌트 디자인) |
| style | 코드 포맷 변경, 세미콜론 누락 등 동작에 영향 없는 코드 정리 |
| refactor | 동작은 그대로, 코드 구조/가독성 개선 |
| type | 타입 정의 수정 |
| docs | 문서 수정 |
| comment | 주석 추가 및 변경 |
| chore | 빌드, 패키지 매니저, 환경 설정 등 개발 환경 관련 |
| lint | ESLint 설정 수정 및 린트 에러 수정 |
| deploy | 빌드 및 배포 작업 |
| test | 테스트 코드 추가 및 수정 |
| rename | 파일 또는 폴더명 변경 |
| remove | 파일 삭제만 한 경우 |

예시.

```
feat(web): 시나리오 선택 시 목표 정보 모달 표시 기능 추가
fix(mobile): 마이크 권한 재요청 후 STT가 초기화되지 않는 문제 수정
design(web): 피드백 페이지 이해도 카드 레이아웃 개선
style: 전체 파일 import 순서 및 들여쓰기 정리
refactor: 시나리오 API 호출 로직을 useScenario 훅으로 분리
chore(web): Tailwind v4 설정으로 마이그레이션
type(mobile): ScenarioResult에 clearStatus 필드 추가
!HOTFIX: 프로덕션 환경에서 로그인 후 토큰 저장 실패 긴급 수정
```

## PR 컨벤션

[뱅크샐러드 코드 리뷰 문화](https://blog.banksalad.com/tech/banksalad-code-review-culture/)를 참고한다.

- PR 제목은 이슈 제목 그대로 작성한다.
- 필요하다면 부연 설명을 위해 본인 PR에 셀프 코멘트를 달아준다.
- PR 코멘트는 '~~바꿔주세요', '~~한 번 고려해주세요' 형태로 작성한다.
- PR 리뷰는 모아뒀다가 오프라인 회의 시 진행한다.
- '코드 추가' 변경 기준 500줄 이하를 권장한다.
- PR은 5~10분 정도로 리뷰 가능한 볼륨으로 작성한다.

## 이슈 관리

- 노션에 이슈를 정리한다. 각 이슈에는 고유 번호가 존재한다. (예: LAN-10)
- 이슈는 제3자가 봐도 이해 가능하도록 최대한 자세하게 작성한다.
- 이슈 = PR 단위. 개발하고 merge 되었으면 수동으로 노션 체크박스를 닫는다.
