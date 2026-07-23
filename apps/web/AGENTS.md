<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## 폴더 구조와 배치 규칙

`src`는 3층이다. `app`(라우트) → `features`(도메인) → `shared`(전역 인프라). import는 위에서 아래로만 흐른다.

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

금지 조항.

- `utils.ts`, `helpers.ts` 금지 — 이름을 못 지으면 개념이 안 선 것이다.
- `features` 간 가로 import는 지양한다. 불가피하면 이유를 한 줄 주석으로 남긴다 (나중에 entities로 뽑을 후보 목록이 된다).
- 예외: `scenario`처럼 여러 feature가 참조하는 공용 슬라이스는 가로 import를 허용한다. 단 공용 슬라이스 자신은 다른 feature를 import하지 않는다 (방향 고정).
- `page.tsx`는 파라미터 해석과 조립만 한다. 로직이 생기면 model로 뽑는다.

팀원이 늘어나면 그때 도입한다. slice별 `index.ts` 공개 API, import 경계 ESLint. 그 전엔 하지 않는다.

`entities` 레이어는 공용 슬라이스가 3개가 되거나 방향 위반이 발견되는 시점에 도입한다. 그때 명사(데이터·표현용 UI)만 내리고 동사(유저 행동 흐름)는 features에 남긴다. 프리톡 도입으로 conversation을 명사(대화 엔진)/동사(시나리오 대화 흐름)로 가르는 때가 유력한 시점이다.
<!-- END:nextjs-agent-rules -->
