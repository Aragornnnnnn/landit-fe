# 웹 폴더 구조

`apps/web/src`의 코드 배치 규칙이다. 도메인이 늘어나도(시나리오·대화·피드백 등) 일관되게 확장하기 위한 청사진이며, 실제 폴더는 그 화면을 만들 때 생긴다.

## 세 층

| 층              | 위치                     | 역할                                                              |
| --------------- | ------------------------ | ----------------------------------------------------------------- |
| **라우팅**      | `src/app/`               | feature를 조립하는 얇은 층. 로직·상태·API 호출을 직접 두지 않는다 |
| **feature**     | `src/features/{도메인}/` | 도메인별 코드. 자기 api·hooks·components·types를 소유한다         |
| **공용 인프라** | `src` 루트               | 여러 feature가 공유하는 것                                        |

## 1. `app/` — 라우팅 전용

feature 코드를 조립하는 얇은 층이다. 화면 로직·상태·API 호출은 feature에서 가져온다. 라우트와 1:1이고 작은 화면(예. 로그인)은 굳이 feature로 빼지 말고 `app/{route}/_components`, `_hooks`로 콜로케이션한다. `_` prefix가 붙은 폴더는 라우팅에서 제외된다.

## 2. `features/{도메인}/` — 도메인별 코드

여러 라우트에 걸치거나 상태·로직이 큰 도메인을 담는다. 현재 도메인은 `scenario`, `conversation`.

- 각 feature는 자기 `api` · `hooks` · `components` · `types`를 소유한다.
- 내부는 처음엔 평평하게 두고, 한 종류 파일이 3~4개를 넘으면 그때 서브폴더로 나눈다.
- **`scenario`** — 시나리오 리스트, 표현 학습. 표현 학습은 현재 시나리오에 종속이라 `scenario` 안 모듈로 둔다. "저장한 표현 / 복습" 같은 크로스-시나리오 화면이 생기면 `features/expression`으로 분리하며, 그때를 대비해 `scenarioId`로 구동하도록 짠다.
- **`conversation`** — 대화 진행 + 피드백. 피드백은 대화 상태에 붙어 다니므로 여기 둔다. 독립 화면이 생기면 분리한다.

## 3. 공용 인프라 (`src` 루트)

여러 feature가 공유하는 것. 별도 `shared/` 우산 없이 종류별 루트 폴더로 둔다.

| 폴더          | 내용                                               |
| ------------- | -------------------------------------------------- |
| `api/`        | HTTP 클라이언트(`client`, `parse`), `auth/refresh` |
| `store/`      | 전역 상태(`auth-store` = 토큰)                     |
| `bridge/`     | 네이티브 postMessage(`web-bridge`)                 |
| `lib/`        | 프레임워크 무관 로직(tts, stt 구현 등)             |
| `hooks/`      | 공용 훅(`useTTS`, `useSTT` 등)                     |
| `components/` | 공용 프리미티브 UI                                 |

## 파일 네이밍

| 종류                      | 규칙                 | 예시                                                |
| ------------------------- | -------------------- | --------------------------------------------------- |
| 컴포넌트                  | PascalCase           | `LoginButton.tsx`, `LanditLogo.tsx`                 |
| 훅                        | `use` + camelCase    | `useSocialLogin.ts`                                 |
| 그 외(유틸·스토어·API 등) | kebab-case           | `auth-store.ts`, `web-bridge.ts`, `social-login.ts` |
| 스타일 모듈               | 대상 컴포넌트명 매칭 | `Button.module.css`                                 |
| 타입 전용 파일            | `*.types.ts`         | `scenario.types.ts`                                 |

- Next.js 예약 파일명은 변형하지 않는다. `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
- 폴더는 소문자 kebab-case. 라우팅 제외 폴더는 `_` prefix(`_components`, `_hooks`), 라우트 그룹은 `(group)`.
- `index.ts` barrel export는 남발하지 않는다(트리셰이킹·순환참조 이슈).

## 관통 규칙

1. **공용 → feature import 금지.** 의존 방향은 `feature → 공용`, `app → feature`만 허용한다. 토큰 저장소·HTTP 클라이언트·브릿지가 특정 feature 안으로 들어가면 안 되는 이유가 이것이다.
2. **feature 간 의존 최소화.** 필요하면 id나 타입 수준으로만 얇게 참조하고, 서로의 컴포넌트를 깊게 끌어다 쓰지 않는다.
3. **빈 폴더를 미리 만들지 않는다.** 위 구조는 청사진이고, 각 폴더는 그 화면을 실제로 만들 때 생긴다.
4. **네이티브 능력은 훅으로 감싼다.** TTS/STT처럼 네이티브를 거치는 기능은 전송이 `bridge`를 타더라도 feature는 `bridge`를 직접 만지지 말고 `useTTS()`/`useSTT()`만 쓴다. 구현을 바꿔도 feature가 안 흔들리게.
