// 결제자 설문 문항 — 프리미엄을 결제한 사람에게 편지로 묻는다. 형식은 questions.ts와 같다
import { CHANNEL_QUESTION, type Question } from './questions';

// 결제 이유를 맨 앞에 둬서 중간에 그만둬도 그 답은 남게 하고, 한 번 누르면 끝나는 유입 경로로 가볍게 마무리한다
export const PAID_QUESTIONS: readonly Question[] = [
  {
    // 결제자가 아직 적어서 보기의 비율보다 자기 말로 쓴 이유가 더 많이 알려 준다 — 결제할 때의 마음까지 받으려고 주관식으로 묻는다
    id: 'premium_reason',
    kind: 'text',
    title: '어떤 이유로 프리미엄을\n결제하시게 되었나요?',
    hint: '마음을 움직인 점, 망설인 점을 알려주세요',
    placeholder: '편하게 적어주세요',
    required: true,
  },
  {
    // 이유는 뭉뚱그려지기 쉬워서 그때의 장면을 따로 묻는다 — 주관식이 이어지니 이 문항은 건너뛸 수 있게 둔다
    id: 'decision_moment',
    kind: 'text',
    title: '결제를 결심한 순간은\n언제였나요?',
    hint: '기억나는 대로 적어주세요',
    placeholder: '편하게 적어주세요',
  },
  {
    // 결제 전의 마음(위 두 문항)과 갈리게 써 본 경험을 묻는다
    id: 'liked_features',
    kind: 'multi',
    title: '써 보니 어떤 기능이\n만족스러우세요?',
    options: [
      '시나리오 대화',
      '대화 중간중간 나오는 상대의 속마음',
      '스몰톡',
      '대화 후 교정 피드백',
      '발음 평가',
      '표현 학습 · 복습',
      '100일 채우면 결제 금액 환급',
    ],
    other: true,
  },
  {
    id: 'disappointment',
    kind: 'text',
    title: '써 보니 아쉬운 점은\n없으셨나요?',
    hint: '고쳤으면 하는 점, 있었으면 하는 기능도 좋아요',
    placeholder: '편하게 적어주세요',
    required: true,
  },
  CHANNEL_QUESTION,
];
