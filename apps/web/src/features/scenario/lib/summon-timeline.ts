// 소환 연출의 박자 — 피그마 키프레임(node 1452:6769)에서 뽑은 값을 한 곳에 모은다.
// 컴포넌트에 흩어두면 어느 것이 먼저 도는지 읽히지 않는다

// 아래 ms는 전부 피그마 타임라인의 값이다. 그대로 돌리면 손이 따라갈 틈이 없어
// 박자를 유지한 채 전체를 늘린다 — 비율을 건드리지 않아야 시안의 리듬이 남는다
const SLOW = 1.5;

// ms 눈금을 motion이 먹는 비율(times)과 초 단위 길이로 옮긴다 — 소환·복귀가 같은 산식을 쓴다
const timeline = (totalMs: number) => ({
  at: (...marks: number[]) => marks.map((ms) => ms / totalMs),
  duration: (totalMs * SLOW) / 1000,
});

// 램프가 흔들리기 시작해 선택지가 다 뜰 때까지 (시안 기준)
const { at, duration: DURATION } = timeline(2600);

// 램프 — 200ms부터 좌우 일곱 번 급하게 휘청이다 부풀며 튀어오른다.
// 흔들림과 점프가 한 몸이라 트랙을 나누지 않는다
export const LAMP = {
  animate: {
    rotate: [0, 0, 8, -10, 12, -14, 14, -12, 10, 0, 0],
    scale: [1, 1, 1.25, 1.12, 0.97, 1, 1],
    y: [0, 0, -24, 10, 0, 0],
  },
  transition: {
    duration: DURATION,
    rotate: {
      duration: DURATION,
      times: at(0, 200, 270, 350, 430, 510, 590, 670, 750, 820, 2600),
    },
    scale: {
      duration: DURATION,
      times: at(0, 200, 820, 890, 960, 1010, 2600),
    },
    y: { duration: DURATION, times: at(0, 200, 820, 890, 960, 2600) },
    ease: 'easeInOut' as const,
  },
};

// 램프 입에서 사방으로 튀는 먼지 — 방향만 다르고 박자는 같다
export const DUST_MS = { delay: 0.85 * SLOW, duration: 0.4 * SLOW };
export const DUST_DIRECTIONS = [
  { x: 0, y: 154 },
  { x: 88, y: 88 },
  { x: -151, y: 151 },
  { x: -171, y: 0 },
  { x: -88, y: -88 },
  { x: 0, y: -216 },
  { x: 120, y: -120 },
  { x: 126, y: 0 },
];

// 램프에서 먼저 새어나오는 연기 — 다섯 덩이가 조금씩 어긋나게 올라간다
export const MIST_COUNT = 5;
export const MIST_MS = {
  start: 400 * SLOW,
  stagger: 40 * SLOW,
  duration: 1710 * SLOW,
};

// 래디 — 램프 입에 꼬리를 문 채 부풀어 오른다. 위치는 안 움직이고 크기만 자란다
// (기준점이 꼬리 끝이라 커지는 것만으로 솟아오르는 것처럼 보인다)
export const GENIE = {
  // 시안은 y 260·scale 0.15로 램프 한참 아래에서 아주 작게 출발한다.
  // 그대로 두면 멀리서 날아오는 것처럼 보여 램프 입 안쪽으로 당겼다
  initial: { opacity: 0, scale: 0.15, rotate: 12 },
  animate: {
    opacity: [0, 0, 1, 1],
    scale: [0.15, 0.15, 1.25, 0.96, 1, 1],
    rotate: [12, 12, -7, 0, 0],
  },
  transition: {
    duration: DURATION,
    // 꼬리가 램프에 물린 채로 커지므로 작을 때부터 보여도 된다
    opacity: { duration: DURATION, times: at(0, 820, 880, 2600) },
    scale: { duration: DURATION, times: at(0, 820, 1020, 1070, 1110, 2600) },
    rotate: { duration: DURATION, times: at(0, 820, 1020, 1100, 2600) },
    ease: 'easeOut' as const,
  },
};

// 딤은 램프가 터지는 순간 깔린다 — 먼저 어두워지면 무엇 때문에 어두워졌는지 알 수 없다
export const DIM = {
  animate: { opacity: [0, 0, 1, 1] },
  transition: { duration: DURATION, times: at(0, 880, 1120, 2600) },
};

// 말풍선과 선택지는 래디가 자리를 잡은 뒤 차례로 얹힌다. 닫기 X는 처음부터 떠 있다
// 래디가 마지막 크기로 앉는 순간(타임라인 1110ms)에 맞춘다 — 말이 먼저 나오면 입이 따로 논다
export const BUBBLE_MS = { delay: 1.11 * SLOW, duration: 0.3 * SLOW };
export const ACCEPT_MS = { delay: 1.41 * SLOW, duration: 0.3 * SLOW };
// 닫기는 선택지와 같이 뜬다 — 답을 요구하면서 물러날 길도 같이 열어야 한다

// 말풍선·선택지가 공통으로 쓰는 등장 — 아래에서 살짝 올라오며 한 번 넘쳤다 제자리
export const popIn = ({
  delay,
  duration,
}: {
  delay: number;
  duration: number;
}) => ({
  initial: { opacity: 0, y: 26, scale: 0.7 },
  animate: { opacity: 1, y: 0, scale: [0.7, 1.06, 1] },
  transition: { delay, duration, ease: 'easeOut' as const },
});

// 시안(390×844 프레임)에서 읽은 각 레이어의 자리.
// 램프 하나만 실측하고 나머지는 램프 기준 배수로 놓는다 — 화면 크기가 달라져도 구도가 유지된다
const FRAME = { w: 390, h: 844 };
const DESIGN = {
  lamp: { x: 100, y: 489, w: 235 },
  genie: { x: 61, y: 277, w: 250 },
  bubble: { x: 76, y: 184, w: 240 },
};

// 시안 프레임 안에서 램프가 서는 자리 — 오버레이가 이 비율로 목표 자리를 잡는다.
// 손으로 나눈 소수를 흩어두면 시안을 재잴 때 어디를 고쳐야 하는지 못 찾는다
export const LAMP_FRAME = {
  widthRatio: DESIGN.lamp.w / FRAME.w,
  centerXRatio: (DESIGN.lamp.x + DESIGN.lamp.w / 2) / FRAME.w,
  topRatio: DESIGN.lamp.y / FRAME.h,
};

const relativeToLamp = ({ x, y, w }: { x: number; y: number; w: number }) => ({
  left: (x - DESIGN.lamp.x) / DESIGN.lamp.w,
  top: (y - DESIGN.lamp.y) / DESIGN.lamp.w,
  width: w / DESIGN.lamp.w,
});

// 램프 폭에 곱해 쓴다. 말풍선 아래끝과 래디 머리가 맞닿고, 래디 꼬리는 램프 안으로 들어간다
// 시안보다 조금 키운다. 꼬리 끝이 램프 입에 물린 자리는 그대로 둬야 하므로,
// 커진 높이만큼 top을 되계산해 아래끝을 붙박아 둔다
const GENIE_GROWTH = 1.12;
const GENIE_ASPECT = 613 / 500;

const grown = (at: { left: number; top: number; width: number }) => {
  const width = at.width * GENIE_GROWTH;
  const bottom = at.top + at.width * GENIE_ASPECT;
  return {
    left: at.left - (width - at.width) / 2,
    top: bottom - width * GENIE_ASPECT,
    width,
  };
};

export const GENIE_AT = grown(relativeToLamp(DESIGN.genie));

// 빛 알맹이가 피어나는 자리 — 시안에서 안개(240px)·먼지퍼프(16px) 모두 램프 목 언저리에서 나온다.
// 색은 둘 다 #FFFBF4, 블러가 걸려 있다
export const GLOW_COLOR = '#FFFBF4';
export const MIST_AT = { x: 0.404, y: -0.251, size: 1.021 };
export const DUST_AT = { x: 0.404, y: 0.366, size: 0.068 };

// 램프 그림의 세로/가로 — 램프 폭만 알면 아래끝이 어디인지 나온다
export const LAMP_ASPECT = 528 / 660;

// CTA는 화면 바닥이 아니라 램프 바로 아래 이만큼 떨어져 선다
export const CTA_GAP_PX = 24;

// 말풍선은 래디 머리 바로 위에 앉는다 (시안에서 둘 사이가 3px).
// 래디 크기를 조절하면 말풍선도 따라 올라가야 해서 top을 래디에서 끌어온다
const BUBBLE_ASPECT = 300 / 600;
const BUBBLE_GAP = 3 / DESIGN.lamp.w;
// 시안보다 조금 키운다
const BUBBLE_GROWTH = 1.18;
const bubbleBase = relativeToLamp(DESIGN.bubble);

export const BUBBLE_AT = {
  left: bubbleBase.left - (bubbleBase.width * (BUBBLE_GROWTH - 1)) / 2,
  width: bubbleBase.width * BUBBLE_GROWTH,
  top:
    GENIE_AT.top -
    bubbleBase.width * BUBBLE_GROWTH * BUBBLE_ASPECT -
    BUBBLE_GAP,
};

// 구도 전체의 세로 폭 — 말풍선 꼭대기부터 램프 바닥까지, 램프 폭 배수.
// 세로가 짧은 폰에서 램프 폭을 얼마나 줄여야 다 들어가는지 이 비율로 계산한다
export const STACK_ASPECT = LAMP_ASPECT - BUBBLE_AT.top;

// 나가기 — 래디가 램프로 빨려 들어가고, 램프가 삼키며 출렁인 뒤 퍼프가 터진다.
// 시안 타임라인의 복귀 구간(550~1750ms)을 복귀 시작 기준으로 옮긴 값
const { at: back, duration: RETURN_DURATION } = timeline(1200);

export const RETURN = {
  // 변형 기준점이 꼬리 끝(램프 입)이라 크기만 줄이면 그 점으로 빨려 들어간다.
  // 시안의 x·y 오프셋은 중심 기준일 때의 값이라 여기선 쓰지 않는다 — 쓰면 램프가 아니라 아래로 밀린다
  genie: {
    animate: {
      scale: [1, 0.85, 0.04, 0.04],
      rotate: [0, 8, 14, 14],
      opacity: [1, 1, 0, 0],
    },
    transition: {
      duration: RETURN_DURATION,
      scale: { duration: RETURN_DURATION, times: back(0, 140, 400, 1200) },
      rotate: { duration: RETURN_DURATION, times: back(0, 200, 400, 1200) },
      opacity: { duration: RETURN_DURATION, times: back(0, 330, 400, 1200) },
      ease: 'easeIn' as const,
    },
  },
  // 램프 몸통이 나가면서 타는 트랙 — 래디를 삼키며 한 번 출렁이고("뿅" 하는 반동),
  // 퍼프가 터지는 순간 사라진다(뒤의 잠든 램프로 갈아끼워지는 느낌).
  // 둘은 한 요소에 같이 걸리므로 여기서 묶는다 — 컴포넌트가 펼쳐 합치면 무엇이 일어나는지 안 보인다
  lamp: {
    animate: {
      scaleX: [1, 1, 1.1, 0.95, 1, 1],
      scaleY: [1, 1, 0.9, 1.05, 1, 1],
      opacity: [1, 1, 0, 0],
    },
    transition: {
      duration: RETURN_DURATION,
      times: back(0, 370, 480, 590, 690, 1200),
      opacity: {
        duration: RETURN_DURATION,
        times: back(0, 740, 840, 1200),
      },
      ease: 'easeOut' as const,
    },
  },
  // 삼킨 자리에서 터지는 퍼프
  puff: {
    animate: { opacity: [0, 0, 1, 0, 0], scale: [0.3, 0.3, 1.7, 1.7] },
    transition: {
      duration: RETURN_DURATION,
      opacity: {
        duration: RETURN_DURATION,
        times: back(0, 700, 800, 1200, 1200),
      },
      scale: { duration: RETURN_DURATION, times: back(0, 700, 1200, 1200) },
      ease: 'easeOut' as const,
    },
  },
  // 말풍선·선택지는 래디보다 먼저 걷힌다 — 말이 남은 채로 사라지면 어색하다
  props: {
    animate: { opacity: 0, scale: 0.92, y: 8 },
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
  // 퍼프가 사그라든 뒤 카드가 드러난다
  dim: {
    animate: { opacity: 0 },
    transition: { delay: 0.95, duration: 0.35, ease: 'easeOut' as const },
  },
};

// 래디의 완료 이벤트는 다른 트랙과 겹치면 늦거나 안 올 수 있다 — 애니메이션 시간에
// 이만큼 여유를 더해 시계로 확정한다
export const ACCEPT_FINISH_BUFFER_MS = 80;

// 수락 — 래디가 빛을 남기며 앞으로 다가오고 화면이 밝아진다. 대화로 넘어가는 문이 된다
export const ACCEPT = {
  genie: {
    animate: { scale: 1.9, opacity: 0 },
    transition: { duration: 0.5, ease: 'easeIn' as const },
  },
  props: {
    animate: { opacity: 0, y: 12 },
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};
