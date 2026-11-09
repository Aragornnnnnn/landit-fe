// 햅틱 점검 화면에 보여 줄 안내 — 진동 이름마다 한글 이름표와 쓰는 때, 그리고 화면별로 진동이 울리는 순간
import type { HapticKind, HapticRhythm } from '@/shared/haptics';

export const KIND_GUIDE: Record<HapticKind, { label: string; when: string }> = {
  tap: { label: '누름', when: '버튼을 누르면 자동으로' },
  tick: { label: '한 칸', when: '값이 한 칸 바뀔 때' },
  success: { label: '완료', when: '보내기·저장이 끝났을 때' },
  celebrate: { label: '축하', when: '해냈을 때' },
  warning: { label: '다시', when: '다시 해 보면 될 때' },
  error: { label: '실패', when: '안 됐을 때' },
};

// 리듬 이름표와 실제로 쓰는 곳 — 카드를 누르면 그 화면이 뜬다
export const RHYTHM_GUIDE: Record<
  HapticRhythm,
  { label: string; use: string }
> = {
  rise: { label: '차오름', use: '스트릭 도장 — 오늘 칸이 차는 순간' },
  coins: { label: '동전', use: '환급 동전 — 알약에 닿는 순간' },
  countUp: { label: '숫자 올라가기', use: '환급 동전 — 이어서 금액이 오를 때' },
  burst: {
    label: '팡',
    use: '복습 만점 — 폭죽이 터지는 순간 (발음 통과도 같음)',
  },
};

/** 한 순간에 오는 진동 — 진동 이름 하나이거나, 큰 순간이면 리듬 */
export type HapticMoment =
  | { moment: string; kind: HapticKind }
  | { moment: string; rhythm: HapticRhythm };

export interface HapticSpot {
  screen: string;
  moments: readonly HapticMoment[];
}

// 새 진동을 넣으면 그 화면 묶음에 한 줄 더한다
export const HAPTIC_SPOTS: readonly HapticSpot[] = [
  {
    screen: '대화',
    moments: [
      { moment: '내 말이 글자로 들어갔을 때', kind: 'tick' },
      { moment: '상대가 대답을 시작할 때', kind: 'tick' },
      { moment: '못 알아들었을 때', kind: 'warning' },
      { moment: '영어 아닌 글자·너무 긴 입력', kind: 'warning' },
      { moment: '대답을 못 받아 왔을 때', kind: 'error' },
    ],
  },
  {
    screen: '발음 연습',
    moments: [
      { moment: '통과했을 때', rhythm: 'burst' },
      { moment: '아쉽게 못 넘었거나 소리가 안 들렸을 때', kind: 'warning' },
      { moment: '마이크를 못 켰거나 분석이 실패했을 때', kind: 'error' },
    ],
  },
  {
    screen: '표현 복습',
    moments: [
      { moment: '칩을 끌다가 자리가 바뀔 때', kind: 'tick' },
      { moment: '전부 맞혔을 때', rhythm: 'burst' },
      { moment: '알림으로 연 복습 퀴즈를 맞혔을 때', kind: 'celebrate' },
    ],
  },
  {
    screen: '스트릭·보상',
    moments: [
      { moment: '오늘 열매가 채워질 때', rhythm: 'rise' },
      { moment: '환급 도장이 찍힐 때', kind: 'celebrate' },
      { moment: '환급 동전이 알약에 닿을 때', rhythm: 'coins' },
      { moment: '이어서 환급 금액이 오를 때', rhythm: 'countUp' },
      { moment: '프리미엄 환영 카드가 열릴 때', kind: 'celebrate' },
      { moment: '초대 보상을 받을 때', kind: 'celebrate' },
    ],
  },
  {
    screen: '롤플레이 만들기',
    moments: [
      { moment: '상대를 옆으로 넘길 때', kind: 'tick' },
      { moment: '시나리오가 만들어졌을 때', kind: 'success' },
    ],
  },
  {
    screen: '마이페이지',
    moments: [
      { moment: '알람 시간 휠이 한 칸 돌 때', kind: 'tick' },
      { moment: '알람을 등록했을 때', kind: 'success' },
      { moment: '피드백·설문을 보냈을 때', kind: 'success' },
      { moment: '첨부 사진이 너무 클 때', kind: 'warning' },
      { moment: '피드백·설문 보내기가 실패했을 때', kind: 'error' },
    ],
  },
];
