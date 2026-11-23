// 대화 무대 배치 계약 — 캐릭터 얼굴 크기와 턱 선(대화 칸이 시작하는 높이)을 화면 높이로 정하는 CSS 길이
//
// 무대(CharacterStage)와 대화 칸이 같은 식을 쓴다. 대화 칸은 STAGE_CHIN_LINE부터 그리면 캐릭터 턱 바로 아래에서 시작한다.
// 값은 화면 위 끝 기준 CSS 길이 식이라 style의 top·height·padding 어디에든 그대로 넣는다(JS 측정·리렌더 없음).
// 키보드는 레이아웃 높이를 줄이지 않는 웹뷰라(useKeyboardInset 참고) 키보드가 떠도 값이 바뀌지 않는다.
import { STAGE_FRAME } from '../character/stage-frame';

// 머리를 놓을 수 있는 가장 높은 자리 — 상태바(safe area) 밑 진행 게이지(4px) 바로 아래. 닫기(X)와 같은 안쪽 여백 기준이다
const HEAD_TOP = 'calc(max(var(--safe-area-inset-top), 8px) + 8px)';

// 얼굴 크기가 화면 높이에서 차지하는 몫 — 375×812에서 75px로 피그마 시안과 같다
const FACE_SHARE_OF_HEIGHT = '9.2dvh';

// 턱 아래에 남길 최소 자리(대화 칸 + 하단 조작). 글자가 커지면 같이 커져, 자리가 모자라면 캐릭터부터 줄인다
const MIN_SPACE_BELOW_CHIN = '24rem * var(--font-scale)';

// 이보다 작으면 얼굴을 알아보기 어렵다 — 자리가 모자라도 여기까지만 줄인다
const MIN_FACE = '40px';

// 턱 위로 얼굴 몇 개 자리를 두는지 — 프레임 위 끝이 곧 머리를 놓는 가장 높은 자리다
const FACES_ABOVE_CHIN = STAGE_FRAME.chinY / STAGE_FRAME.face;

/** 얼굴 크기(눈→턱 px). 화면 높이 몫을 쓰되, 턱 아래 자리가 모자라면 그만큼 줄인다 */
const STAGE_FACE = `max(${MIN_FACE}, min(${FACE_SHARE_OF_HEIGHT}, calc((100dvh - ${MIN_SPACE_BELOW_CHIN} - ${HEAD_TOP}) / ${FACES_ABOVE_CHIN})))`;

/** 턱 선 — 화면 위 끝에서 캐릭터 턱 끝까지. 대화 칸은 여기서 시작한다 */
export const STAGE_CHIN_LINE = `calc(${HEAD_TOP} + ${FACES_ABOVE_CHIN} * ${STAGE_FACE})`;

/** 무대 바닥색 — 위는 밝고 아래로 갈수록 회색. 앱 배경(gray-50)보다 한 톤 깊어 캐릭터가 바닥에 선 느낌을 준다. 스켈레톤도 같은 색을 깐다 */
export const STAGE_BACKGROUND_CLASS =
  'bg-[linear-gradient(to_bottom,var(--gray-100),var(--gray-200)_62%)]';

/** 캐릭터 상자(프레임 전체)의 위 끝·너비·높이 — 무대 안에서만 쓴다 */
export const CHARACTER_BOX = {
  top: HEAD_TOP,
  width: `calc(${STAGE_FRAME.width / STAGE_FRAME.face} * ${STAGE_FACE})`,
  height: `calc(${STAGE_FRAME.height / STAGE_FRAME.face} * ${STAGE_FACE})`,
} as const;
