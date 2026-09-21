import type { ProgressTone } from '@/shared/ui/ProgressBar';

// 대화 진행 게이지 — 지금 화면에 떠 있는 카드(turnIndex)만으로 채움 비율·톤·마지막 질문 여부를 낸다.
// 답한 횟수를 따로 세면 답을 낸 직후 속마음이 도는 동안 게이지만 먼저 움직여, 아직 이전 질문이 떠 있는
// 카드 위에 "마지막 질문" 머리말이 붙는다. 화면에 보이는 것 하나로 계산해야 둘이 같은 순간에 바뀐다.

interface TalkGaugeInput {
  // 대화 엔진이 세는, 지금 떠 있는 카드의 순번
  turnIndex: number;
  firstSpeaker: 'AI' | 'USER';
  // 서버가 세는 고정 질문 개수 — 세션 시작 응답이 오기 전엔 모른다
  totalQuestionCount: number | null;
}

interface TalkGauge {
  ratio: number; // 0..1
  tone: ProgressTone;
  lastQuestion: boolean;
}

// 진입 직후에도 비어 보이지 않게 깔아 두는 바닥값 — 남은 폭을 내가 말할 횟수로 똑같이 나눠 채운다
const startFill = 0.08;

export const toTalkGauge = ({
  turnIndex,
  firstSpeaker,
  totalQuestionCount,
}: TalkGaugeInput): TalkGauge => {
  // 총 질문 수를 모르면 칸을 나눌 수 없다 — 0이 와도 여기서 걸러 나눗셈에 넣지 않는다
  if (!totalQuestionCount) {
    return { ratio: startFill, tone: 'primary', lastQuestion: false };
  }

  // 내가 말할 횟수 — USER 선발화는 고정 질문 앞에 "먼저 말을 걸어보세요" 한 턴이 더 있고,
  // 그 턴은 서버가 세는 고정 질문에 안 들어간다
  const steps = totalQuestionCount + (firstSpeaker === 'USER' ? 1 : 0);
  // 종료 인사는 마지막 질문을 넘어선 턴이라 비율이 1을 넘지 않게 막는다
  const ratio = startFill + (1 - startFill) * Math.min(1, turnIndex / steps);

  return {
    ratio,
    tone: ratio >= 1 ? 'success' : 'primary',
    lastQuestion: turnIndex === steps - 1,
  };
};
