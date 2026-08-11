<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## 폴더 구조와 배치 규칙

`src`는 4층이다. `app`(라우트) → `features`(도메인 동사) → `entities`(도메인 명사) → `shared`(전역 인프라). import는 위에서 아래로만 흐른다.

새 파일의 자리는 이 순서로 정한다.

1. **한 라우트에서만 쓰나?** → 그 라우트의 `_ui/`, `_model/`. 두 번째 사용처가 생기는 순간 아래층으로 내린다. 미리 승격하지 않는다. (세그먼트 어휘는 전 층 공통 `ui`/`model`/`api`/`lib` — 라우트에선 언더스코어를 붙인다)
   - 공유 범위 = 폴더 범위. 소비자가 파일 하나면 인라인, 몇 개 라우트면 그들만 담는 중첩 그룹(`(legal)`처럼), 그룹 전체면 그룹 루트 `_ui/`.
   - `app` 최상위는 접근 조건으로 가른다 — `(public)`(비로그인 접근 가능) / `(protected)`(로그인 필요).
   - `app/api`는 요청을 받는 URL(route.ts는 해석·위임만), features의 `api`는 요청을 보내는 코드다.
2. **도메인 소속인가?** → `features/<도메인>/`의 segment로. 도메인 = 기획에서 독립된 이름으로 불리는 기능 단위(대화, 표현, 온보딩…). 슬라이스 하나가 그 도메인의 전부를 담는다 — entities 도입 전까지 명사(데이터)/동사(행동)를 가르지 않는다.
   - `api/` 백엔드 요청 함수와 응답 타입
   - `model/` 도메인 규칙·상태·쿼리 훅. 규칙은 React 없는 순수 모듈로 쓰고 옆에 테스트를 붙인다. 훅은 배선만 한다
   - `ui/` 도메인 컴포넌트. 화면 덩어리는 Flow 컴포넌트가 담당한다
   - `lib/` 도메인을 거드는 보조 도구. model과 헷갈리면 "기획 회의에서 언급될 내용인가"로 가른다 (그렇다 → model)
3. **여러 도메인이 쓰는 기술인가?** → `shared/`. 파일이 3개 이상 모이는 주제는 형제 폴더로 독립시키고(analytics, bridge, haptics, motion처럼), `shared/lib`엔 이름 붙일 주제가 없는 범용 유틸·훅만 남긴다.

import 경로는 FSD 규칙을 따른다 — 같은 슬라이스(라우트 구역, `features/<도메인>`, shared 주제 폴더) 안은 상대 경로, 슬라이스·층을 넘으면 절대 경로(`@/`). 슬라이스를 통째로 옮겨도 내부 결선이 안 깨지게.

금지 조항.

- `utils.ts`, `helpers.ts` 금지 — 이름을 못 지으면 개념이 안 선 것이다. `types.ts`, `constants.ts`도 같은 병 — 내용물 형태가 아니라 개념으로 파일을 가른다.
- 파일명 — 컴포넌트 `Pascal.tsx`, 훅 `useCamel.ts`, 나머지 모듈은 `kebab-case.ts`.
- 서버 상태 훅(본체가 useQuery/useMutation 하나인 얇은 래퍼)은 `Query`/`Mutation` 접미사를 붙인다. 쿼리를 부품으로 쓰는 지휘자 훅(useConversationFlow 등)은 제외.
- `features` 간 가로 import는 지양한다. 불가피하면 이유를 한 줄 주석으로 남긴다 (나중에 entities로 뽑을 후보 목록이 된다).
- 예외: `scenario`·`feedback`처럼 여러 feature가 참조하는 공용 슬라이스는 가로 import를 허용한다. 단 공용 슬라이스 자신은 다른 feature를 import하지 않는다 (방향 고정).
- `page.tsx`는 파라미터 해석과 조립만 한다. 로직이 생기면 model로 뽑는다.

이름 규칙.

- 함수 이름은 행위 동사구 — 무엇을 하는지 말한다 (pressMic, submitVoice, recoverFromSttError). `handle~`·`process~`처럼 "다룬다"는 사실만 말하는 이름은 쓰지 않는다.
- 콜백 자리(옵션·프롭)는 `on{사건}`으로 선언하고(onFinal, onInputStart), 거기 꽂는 구현 함수는 행위 이름을 쓴다 — 사건 선언과 행위 구현의 구분.
- 저수준 계약은 웹 플랫폼 어휘를 따른다 — 예: 인식 세션의 `stop`(확정)/`abort`(파기)는 SpeechRecognition·AbortController와 동일. 제품 언어(취소·완료)는 도메인 층 함수명에서 쓴다 (cancelInput).
- 한 개념 한 단어 — 같은 개념이 층을 관통하면 전 층에서 같은 단어를 쓴다 (파기=abort). 동의어(cancel/abort/discard) 혼용 금지.

팀원이 늘어나면 그때 도입한다. slice별 `index.ts` 공개 API, import 경계 ESLint. 그 전엔 하지 않는다.

`entities` 레이어는 스몰톡 도입(LAN-217)과 함께 열렸다. `entities/conversation`이 대화 엔진(상태기계·턴 루프·입력/재생/속마음 훅·대화 UI)을 담고, 대화 유형별 동사는 features가 담는다 — `scenario-talk`(시나리오 대화 흐름), `small-talk`(스몰톡). 규칙 둘.

- entities는 feature를 모른다 — entities 안에 scenario·smalltalk·feedback·streak 같은 도메인 단어가 등장하면 경계 위반이다. 다른 부분(세션 시작·발화 제출·완료 판정·완료 후속)은 엔진이 주입받는다 (`useConversationTurns`의 submit/ensureSession).
- 미리 일반화하지 않는다 — 실제로 두 대화 유형이 다르다고 확인된 지점만 주입점으로 만들고, 나머지는 엔진에 그대로 둔다. 세 번째 유형이 생겨 실제로 다를 때 그때 뽑는다.

<!-- END:nextjs-agent-rules -->
