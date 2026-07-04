---
name: git-commit
description: 커밋 메시지 컨벤션에 맞게 커밋 생성
---

# Git Commit

커밋 메시지 형식: `{type}({scope}): 커밋 메시지`

- **scope**: `mobile` (React Native) | `web` (Next.js) | 생략 가능 (공통 변경)
- **message**: "무엇을" + "왜/어떻게"를 한국어로. 단순 나열 금지.

## 타입 목록

| Tag      | 설명                                                               |
| -------- | ------------------------------------------------------------------ |
| feat     | 새로운 기능 추가                                                   |
| fix      | 버그 수정                                                          |
| design   | 사용자에게 보이는 UI 시각적 변경 (레이아웃, 색상, 컴포넌트 디자인) |
| style    | 코드 포맷 변경, 세미콜론 누락 등 동작에 영향 없는 코드 정리        |
| refactor | 동작은 그대로, 코드 구조/가독성 개선                               |
| type     | 타입 정의 수정                                                     |
| docs     | 문서 수정                                                          |
| comment  | 주석 추가 및 변경                                                  |
| chore    | 빌드, 패키지 매니저, 환경 설정 등 개발 환경 관련                   |
| lint     | ESLint 설정 수정 및 린트 에러 수정                                 |
| deploy   | 빌드 및 배포 작업                                                  |
| test     | 테스트 코드 추가 및 수정                                           |
| rename   | 파일 또는 폴더명 변경                                              |
| remove   | 파일 삭제만 한 경우                                                |

## 애매한 경우 판단 방법

타입 선택이 불확실하면 변경 내용을 설명하고 사용자에게 확인 후 커밋.

## 메시지 작성 기준

- 좋음: `fix(mobile): STT가 마이크 권한 재요청 후 초기화되지 않아 음성 인식 안 되는 문제 수정`
- 나쁨: `fix(mobile): 버그 수정`
- 좋음: `feat(web): 피드백 페이지에서 발화 시간 기반 성장 지표 표시 기능 추가`
- 나쁨: `feat(web): 기능 추가`

## 예시

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
