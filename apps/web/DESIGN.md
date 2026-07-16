---
id: landit
name: Landit
country: KR
category: edtech / language-learning
platform: mobile-webview (Next.js in native shell)
primary_color: '#e07a3a'
font: Pretendard + Tossface
verified: '2026-07-07'
source: saynow-fe apps/web DESIGN.md(2026-06-11 코드 추출본) 기반으로 작성
---

# Landit Design System

외국인과의 실제 상황을 시뮬레이션하며 영어 회화를 연습하고, AI가 외국인 관점의 이해도 피드백을 주는 모바일 학습 앱. 이 문서는 기존 레포(saynow-fe)의 실제 코드에서 추출·검증된 디자인 시스템을 기반으로 landit-fe에 추가한 기준 문서다.

> **추가 현황 (LAN-60 기준).** 코드에 반영된 것은 **색상 토큰(3레이어 구조) + radius 체계 + 폰트 로딩**(`globals.css`, `layout.tsx`)까지다. 컴포넌트(§4)·레이아웃(§5)·모션(§9) 등은 아직 코드에 없으며, 해당 컴포넌트를 추가하는 이슈에서 이 문서를 스펙으로 삼는다.

## 1. Visual Theme & Atmosphere

Landit은 **따뜻하고 손맛 나는 게이미피케이션 학습 앱**이다. Duolingo처럼 부담 없이 한 판씩 도전하는 느낌을 주되, 색은 차분한 테라코타 오렌지(`#e07a3a`)로 잡아 학습 도구다운 신뢰감을 유지한다. 화면은 살짝 따뜻한 오프화이트(`#fbfbfa`) 위에 순백 카드(`#ffffff`)를 얹고, 본문은 묵직한 near-black(`#111111`)으로 또렷하게 읽힌다.

핵심 정체성은 두 가지다. 첫째, **3D 버튼** — 모든 주요 버튼은 아래쪽에 단색 그림자(`0_5px_0`)를 깔고 눌리면 `translate-y`로 내려앉아 물리 버튼처럼 반응한다. 둘째, **이모지를 적극 활용한다** — Tossface 폰트로 시나리오 아이콘(🗂️ 👋 🎉 ☁️)을 일관되게 렌더링해 감정과 재미를 전한다. 타이포는 작고 빽빽한 게 아니라 크고 두껍게(30px black, 26px extrabold) 말 걸듯 표현적이다.

웹이지만 **모바일 전용**이다. 데스크톱에서도 항상 430px 폭 컨테이너를 중앙에 띄우고 바깥은 zinc-200으로 채워, 어디서 열어도 앱처럼 보인다. 스크롤바는 전역에서 숨긴다.

**Key Characteristics:**

- 테라코타 오렌지 `#e07a3a` 단일 브랜드 액센트 (CTA·진행·강조)
- 시그니처 3D 버튼: `shadow-[0_5px_0_#A85822]` + `active:translate-y-0.75`
- Pretendard 본문 + Tossface 이모지 — 이모지는 금지가 아니라 핵심 표현 수단
- 크고 두꺼운 표현형 타이포 (black/extrabold 헤드라인)
- 모바일 전용 max-width 430px 중앙 컨테이너
- safe-area inset 전면 대응 (네이티브 웹뷰 환경)
- 따뜻한 중성 그레이 스케일 + iOS 시스템 그레이(`#F2F2F7`) 활용

## 2. Color Palette & Roles

### 토큰 아키텍처 — 3레이어

기존 MVP는 색을 컴포넌트 인라인 hex로 박아 다크모드 대응이 불가능했다. 같은 실수를 반복하지 않도록 `globals.css`는 3레이어로 구성한다.

```
Layer 1  Primitive (--gray-100, --orange-500)  ← 컴포넌트에서 직접 쓰지 않음, 다크에서도 불변
Layer 2  Semantic  (--background, --primary)   ← 다크모드 도입 시 이 레이어만 재정의
Layer 3  컴포넌트                                ← 오직 시맨틱 토큰만 참조 (bg-primary 등)
```

- **뉴트럴 램프는 웜 그레이 한 벌로 통일한다** — 기존 코드에 웜 그레이(`#fbfbfa` 계열)와 iOS 쿨 그레이(`#f2f2f7` 계열)가 섞여 있었다. 공식 램프는 웜 그레이(`--gray-*`)이고, iOS 그레이·텍스트 그레이(`#222`~`#999`)는 사용 컴포넌트 추가 시 이 램프로 흡수하거나 primitive로 추가한다.
- **다크 팔레트 값은 아직 없다. 지어내지 말 것** — 구조만 열어뒀다 (`globals.css`의 `.dark` 주석 참고).
- **브랜드 파트너 색(카카오 `#FEE500`/`#191919`, 구글 4색)은 토큰으로 만들지 않는다** — 로고 규정색이라 다크에서도 절대 안 바뀌므로, 사용 컴포넌트에서 리터럴 상수로 관리한다.

### Brand — 토큰화 완료

- **Terracotta `#e07a3a`** — `--primary`, `--ring`. 주요 CTA, 사용자 말풍선, 진행/강조, 점수 게이지.
- **Deep Terracotta `#c4601f`** — `--accent`. 강조 변형.
- **Primary Light `#e8935a`** — `--primary-light`. 그라데이션·연한 강조.
- **Button Shadow `#A85822`** — primary 3D 버튼의 아래 그림자 (버튼 추가 시 토큰화).
- **Pressed `#b8651a`** — 눌림/짙은 강조 (버튼 추가 시 토큰화).

### Neutral & Surface — 토큰화 완료

- **Background `#fbfbfa`** — `--background`. 따뜻한 오프화이트 페이지 바탕.
- **Card `#ffffff`** — `--card`, `--popover`. 카드·시트 표면.
- **Foreground `#111111`** — `--foreground`. 제목·본문 near-black.
- **Secondary/Muted `#f5f5f3`** — `--secondary`, `--muted`. 보조 면.
- **Muted Foreground `#6b7280`** — `--muted-foreground`. 보조 텍스트.
- **Border `#e5e5e0`** — `--border`, `--input`. 기본 구분선.

### Semantic — destructive만 토큰화

- **Danger Red `#ff3b30`** — `--destructive`. 파괴적 동작. (원본 CSS의 oklch 값과 컴포넌트 하드코딩 `#ff3b30`이 달랐던 것을 `#ff3b30`으로 통일함)
- **Success Green `#22c55e`** (강조 `#16a34a`, tint `#f0fdf4`/`#bbf7d0`) — 완료 체크, 성공. 사용 컴포넌트 추가 시 토큰화.
- **Info Blue `#007aff`** (`#3b82f6`, tint `#eff6ff`/`#bfdbfe`) — 정보·링크. 사용 컴포넌트 추가 시 토큰화.

### 미토큰화 — 해당 컴포넌트 추가 시 토큰화한다

특정 화면·컴포넌트에 종속된 색이라 미리 토큰으로 만들지 않는다. 추가할 때 이 목록을 참조할 것.

| 색                   | 값                                        | 사용처                                                          |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| iOS Gray             | `#F2F2F7`                                 | 홈 시나리오 화면 바탕 (7회 사용, 승격 1순위)                    |
| Subtle Text          | `#888888`                                 | 캡션·아이콘 라벨                                                |
| Divider              | `#ebebeb`                                 | 헤더 하단선, AI 말풍선 배경                                     |
| Secondary Button     | `#EBEBEA` / shadow `#C8C8C6`              | 보조·잠금 버튼                                                  |
| Feedback Tint        | `#fff4ec` / `#f0d9c8`                     | 피드백 카드 오렌지 배경/보더                                    |
| Onboarding Panel     | `#f0ede8` / `#f3f0ea` / `#e5e0d8`         | 온보딩 전용 따뜻한 패널                                         |
| Danger Button Shadow | `#991B1B`                                 | danger 3D 버튼 그림자                                           |
| Text Grays           | `#222` `#444` `#555` `#666` `#888` `#999` | 손으로 만들어진 텍스트 그레이 — 추가 시 웜 그레이 램프로 정형화 |

> 카카오·구글 색은 위 표에 없다 — 토큰 대상이 아니라 리터럴 상수다 (§2 아키텍처 참고).

> **다크모드 미지원.** 라이트 단일 테마다. 컴포넌트에 `dark:` 분기를 넣지 말 것.

## 3. Typography Rules

### Font Family

- **본문/제목**: `'Pretendard Variable'` (`--font-sans`) — npm 패키지로 **자체 호스팅**, 다이나믹 서브셋이라 화면에 나온 글자 조각만 다운로드된다. 회화 앱 특성상 유저·AI 생성 텍스트가 임의의 한글을 쓰므로 커스텀 서브셋(글자 추출)을 만들지 말 것.
- **이모지**: `.tossface` 유틸 클래스 — Tossface 폰트(CDN)로 모든 플랫폼에서 동일한 이모지 렌더링
- **원칙**: 커스텀 브랜드 서체 없음. Pretendard 하나로 무게(weight)만으로 위계를 만든다.

### Hierarchy (실제 사용 사이즈)

| Role    | Size    | Weight          | Notes                    |
| ------- | ------- | --------------- | ------------------------ |
| Hero    | 30px    | black (900)     | 온보딩 인사, 핵심 메시지 |
| Display | 26px    | extrabold (800) | 빈 상태·완료 메시지      |
| Title L | 20px    | extrabold (800) | 시나리오 카드 제목       |
| Title   | 18px    | bold (700)      | 보조 메시지              |
| Header  | 17px    | semibold (600)  | 화면 헤더 타이틀         |
| Body    | 14px    | medium/semibold | 본문, 말풍선, 카드 설명  |
| Caption | 12–13px | medium          | 보조 텍스트, 번역문      |
| Micro   | 10px    | medium          | 탭/아이콘 라벨           |

### Principles

- **무게로 말한다**: medium(500) → semibold(600) → bold(700) → extrabold(800) → black(900). 헤드라인일수록 굵게.
- **표현형 스케일**: compact가 아니라 크고 시원한 타이포로 친근하게 말 건다.
- **줄간격**: 헤드라인 `leading-snug`~`leading-[1.3]`, 본문 `leading-relaxed`.

## 4. Component Stylings (추가 예정 — 스펙 참조용)

### Buttons — 시그니처 3D

- **구조**: `w-full` flex center, `transition-transform duration-75`, `active:translate-y-0.75`
- **그림자**: 평상시 `shadow-[0_5px_0_<dark>]`, 눌림 `active:shadow-[0_2px_0_<dark>]` — 물리 버튼 느낌
- **Variants**:
  - `primary` — `bg-primary text-white`, shadow `#A85822`
  - `white` — 흰→그레이 그라데이션, `text-primary`
  - `secondary` — `bg-[#EBEBEA] text-foreground`, shadow `#C8C8C6`
  - `ghost` — `bg-white` + `border-border`, shadow `#C8C8C6`
  - `danger` — `bg-red-600`, shadow `#991B1B`
- **Sizes**: `lg` h-14 rounded-2xl bold / `md` h-12 rounded-xl semibold / `sm` h-10 rounded-xl
- **Disabled**: `opacity-45`, `translate-y-0!`, `shadow-none!` (그림자 제거로 눌림 불가 표현)
- **Loading**: 인라인 스피너(`animate-spin`, 색은 variant 대비) + children 유지

### Chat Bubbles

- **AiBubble**: `bg-[#EBEBEB]`, `rounded-2xl rounded-bl-md`, 본문 14px + 번역문 12px muted. `...`이면 TypingDots.
- **UserBubble**: `bg-primary text-white`, `rounded-2xl rounded-br-md`. 누르면 `active:opacity-75`.
- 둘 다 등장: `initial opacity 0 / y 10` → `0.25s easeOut`.

### Cards

- **Scenario Card**: `rounded-[20px] bg-card shadow-md`, 이미지(flex)+텍스트(CTA) 세로 구성. 잠금 시 `grayscale(100%) brightness(0.7)`, 해금 시 1s filter 트랜지션.
- 라운드 관습: `rounded-2xl`(16px) 표준, `rounded-[20px]` 카드, `rounded-full` 칩/점/배지.

### Tint / Highlight Card (피드백 화면)

의미별로 **연한 배경 + 동일 계열 border + 진한 텍스트** 3종 세트를 일관되게 쓴다. 새 강조 카드도 이 규칙을 따른다.

| 의미                 | 배경      | Border    | 강조 텍스트 |
| -------------------- | --------- | --------- | ----------- |
| 전달력·점수 (브랜드) | `#FFF4EC` | `#F0D9C8` | `#E07A3A`   |
| 잘한 점 (긍정)       | `#F0FDF4` | `#BBF7D0` | `#16A34A`   |
| 통한 디테일 (정보)   | `#EFF6FF` | `#BFDBFE` | `#3B82F6`   |

- 컨테이너 `rounded-2xl px-4 py-4`. 점수 게이지: 채움 `#E07A3A`, 미달 `#E4E4E7`. 트랙 양끝 점 시작 `#B8651A` / 끝 `#C4C4C4`.

### Bottom Sheet

- 오버레이 `bg-black/40` 페이드 + 패널 `rounded-t-3xl bg-white px-6 pt-6`
- 등장: `y 100% → 0`, **spring** `{ damping: 28, stiffness: 300 }`
- `max-w-[430px]` 중앙 정렬, `paddingBottom: max(safe-area-inset-bottom, 24px)`

### Toast

- 상단 표시(`top: safe-area + 64px`), 중앙 정렬, 2.5s 자동 소멸
- `bg rgba(30,30,30,0.92)` + `backdrop-blur(8px)`, 흰 14px semibold, `rounded-2xl`
- 등장: `opacity/y/scale` 0.2s easeOut

## 5. Layout Principles

### Container — 모바일 전용

- 루트: `max-w-[430px]` 중앙 컨테이너 + `shadow-xl`, 바깥 바탕 `bg-zinc-200`
- 높이: `h-full` / 화면은 `h-dvh`
- 뷰포트: `maximumScale: 1, userScalable: false` (확대 금지)

### Safe Area

- 모든 상/하단 고정 요소는 `env(safe-area-inset-*)`로 노치/홈바 대응
- 패턴: 헤더 `paddingTop: max(env(safe-area-inset-top), 16px)`, 하단 시트 `max(env(safe-area-inset-bottom), 24px)`

### Spacing

- Tailwind 기본 4px 그리드. 가로 거터 주로 `px-5`(20px)~`px-6`(24px)
- 카드 내부 `px-5 pt-4 pb-5`, 요소 간 `gap-2`~`gap-4`

### Border Radius

- `--radius: 0.75rem` (12px) 기준, 파생 sm~4xl — 토큰화 완료
- 관습값: 버튼 md/sm `rounded-xl`(12px), 버튼 lg·말풍선 `rounded-2xl`(16px), 시트 `rounded-t-3xl`, 카드 `rounded-[20px]`, 칩/점 `rounded-full`

### Scrollbar

- 전역에서 숨김 — 네이티브 앱 느낌 유지 (토큰화 완료, `globals.css` base)

## 6. Depth & Elevation

| Level             | Treatment                              | Use                             |
| ----------------- | -------------------------------------- | ------------------------------- |
| 3D Button (rest)  | `0_5px_0_<solid>`                      | 모든 주요 버튼의 기본 입체감    |
| 3D Button (press) | `0_2px_0_<solid>` + `translate-y-0.75` | 눌림 — 깊이 감소                |
| Card              | `shadow-md`                            | 시나리오 카드, 스켈레톤         |
| Sheet/Toast       | `shadow-lg` / `shadow-xl`              | 바텀시트, 토스트, 루트 컨테이너 |

**Shadow 철학**: 일반 카드는 부드러운 Tailwind 그림자를 쓰지만, **버튼만큼은 단색 오프셋 그림자(blur 0)** 로 물리적 입체를 만든다. 이 3D 버튼이 Landit의 촉각적 정체성이다 — 색을 흐리지 말고 깊이를 단단하게 표현한다.

## 7. Do's and Don'ts

### Do

- 주요 버튼은 항상 3D 그림자 패턴을 쓴다
- 브랜드 액센트는 테라코타 `#e07a3a` 하나로 통일한다
- 이모지는 `.tossface` 클래스로 렌더해 플랫폼 간 일관성을 지킨다
- 고정 요소엔 `env(safe-area-inset-*)`를 반드시 적용한다
- 색은 `--primary`, `--foreground` 등 CSS 변수/시맨틱 토큰으로 참조한다
- 헤드라인은 사이즈보다 weight(extrabold/black)로 위계를 만든다
- 등장 애니메이션은 `fade + y:10, 0.25s easeOut` 패턴을 따른다

### Don't

- 버튼에 단색 오프셋 대신 흐린 그림자(blur)를 쓰지 않는다 — 3D 정체성 훼손
- 테라코타 외 두 번째 브랜드 색을 도입하지 않는다 (시맨틱 색은 예외)
- 데스크톱 풀폭 레이아웃을 만들지 않는다 — 항상 430px 컨테이너
- 이모지 대신 직접 그린 SVG로 시나리오 아이콘을 대체하지 않는다 (Tossface 일관성)
- 본문에 순흑 `#000`을 쓰지 않는다 — `#111111` 사용
- 컴포넌트에 `dark:` 분기를 넣지 않는다 — 라이트 단일 테마

## 8. Responsive Behavior

단일 뷰포트(모바일) 앱이라 전통적 브레이크포인트 대신 **고정 430px 컨테이너**로 동작한다.

| 환경                   | 동작                                |
| ---------------------- | ----------------------------------- |
| 모바일 (네이티브 웹뷰) | 풀스크린, safe-area inset 적용      |
| 데스크톱 브라우저      | 430px 컨테이너 중앙 + zinc-200 바탕 |

### Touch Targets

- 버튼: lg 56px / md 48px / sm 40px 높이
- 헤더 액션: 44px (`h-11`)
- `active:scale-90`, `active:opacity-75` 등 즉각 피드백

## 9. Motion & Easing (추가 예정 — framer-motion 도입 이슈에서)

부드러운 등장이 기본이고, 바텀시트만 spring을 쓴다.

| 패턴      | 값                                             | Use                     |
| --------- | ---------------------------------------------- | ----------------------- |
| 기본 등장 | `opacity 0→1, y 10→0`, 0.25s easeOut           | 말풍선, 페이지, 카드    |
| 스태거    | `delay: index * 0.08`, 0.38s `[0.22,1,0.36,1]` | 시나리오 카드 순차 등장 |
| 바텀시트  | spring `damping 28, stiffness 300`             | BottomSheet 슬라이드업  |
| 토스트    | `opacity/y/scale`, 0.2s easeOut                | Toast                   |
| 버튼 누름 | `transition-transform duration-75`             | 3D 버튼                 |

## 10. Voice & Tone

해요체 기반의 친근한 응원 톤. 핵심만:

| 요소      | 원칙                      | 예                                         |
| --------- | ------------------------- | ------------------------------------------ |
| CTA       | 1인칭 동사·다음 화면 예고 | `시작할게요`, `다시 해볼게요`, `좋아요!`   |
| 빈 상태   | 이유 + 가벼운 다음 행동   | `다음 상황이 기다리고 있어요`              |
| 잠금      | 권유형, 강요 금지         | `앞선 시나리오를 먼저 클리어해봐요!`       |
| 감정 공감 | 사실 뒤의 감정에 반응     | `외국인 귀에 어떻게 들렸는지 알려드릴게요` |
| 완료      | 축하 + 다음 기대          | `세 상황을 모두 해보셨네요!`               |

- **이모지 OK**: 학습 앱답게 Tossface 이모지로 감정·재미를 더한다 (단, 에러 메시지엔 절제)
- **금지**: 과도한 경어(`~시겠어요`), 공포·손해 프레임, 무의미한 반복 문장
- 문체: 능동형·긍정형, `되어요`→`돼요`

## 11. Design-Relevant Tooling

- **Styling**: Tailwind CSS v4 (`@theme inline`) — 색·라운드·간격은 `globals.css`의 CSS 변수로 참조 (도입 완료)
- **Motion**: framer-motion — §9 패턴 (모션 필요한 컴포넌트 추가 시 도입)
- **Icons**: lucide-react (UI 아이콘) + Tossface (이모지) — 두 체계를 섞지 않는다 (아이콘 이슈에서 도입)

## 12. States (Loading · Empty · Error)

실제 화면에서 반복되는 상태 패턴. 새 화면도 이 형태를 따른다.

| 상태                    | 처리                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Loading (스켈레톤)**  | `.skeleton` 클래스 — 최종 레이아웃과 같은 형태의 블록에 shimmer. 결과물 윤곽을 그대로 본뜬다. (컴포넌트 추가 시 keyframes 포함) |
| **Empty (잠금/준비중)** | 일러스트 대신 Tossface 이모지(☁️ ❓) + 한 줄 안내. 잠금 카드는 `grayscale`, `준비 중이에요`.                                    |
| **Empty (전부 완료)**   | 축하 이모지(🎉) + 큰 메시지(26px extrabold) + 다음 기대 한 줄.                                                                  |
| **Error (재시도)**      | muted 메시지 + `text-primary` 텍스트 버튼 `다시 시도`. 중앙 정렬 간결형.                                                        |
| **Toast**               | 일시적 알림은 상단 토스트(§4), 2.5s 자동 소멸.                                                                                  |

---

**Verified:** 2026-07-07 — saynow-fe `apps/web` 코드 추출본(2026-06-11) 기반, 토큰·폰트만 코드 반영
**코드 반영 파일:** `src/app/globals.css`(토큰·base·tossface), `src/app/layout.tsx`(폰트 로딩)
