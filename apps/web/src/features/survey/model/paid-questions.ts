// 결제자 설문 문항 — 프리미엄을 결제한 사람에게 편지로 묻는다. 형식은 questions.ts와 같다
import { CHANNEL_QUESTION, type Question } from './questions';

// 순서는 알고 싶은 순서 — 결제 이유를 맨 앞에 둬서 중간에 그만둬도 그 답은 남게 하고, 유입 경로는 가볍게 맨 뒤에
export const PAID_QUESTIONS: readonly Question[] = [
  {
    // 결제자가 아직 적어서 보기의 비율보다 자기 말로 쓴 이유가 더 많이 알려 준다 — 결제할 때의 마음까지 받으려고 주관식으로 묻는다
    id: 'premium_reason',
    kind: 'text',
    title: '어떤 이유로 프리미엄을\n결제하시게 되었나요?',
    hint: '결제를 결심한 순간을 떠올려 주셔도 좋아요',
    placeholder: '편하게 적어주세요',
    required: true,
  },
  {
    // 결제 전에 기대한 것(위 문항)과 갈리게 써 본 경험을 묻는다
    id: 'liked_features',
    kind: 'multi',
    title: '써 보니 어떤 기능이\n가장 만족스러우세요?',
    options: [
      '시나리오 대화',
      '대화 중간중간 나오는 상대의 속마음',
      '스몰톡',
      '대화 후 교정 피드백',
      '발음 평가',
      '표현 학습 · 복습',
      '스트릭 · 위젯',
    ],
    other: true,
  },
  {
    id: 'disappointment',
    kind: 'text',
    title: '아쉬웠던 점을\n알려주세요',
    hint: '고쳤으면 하는 점도 좋아요',
    placeholder: '편하게 적어주세요',
    required: true,
  },
  {
    id: 'wish',
    kind: 'text',
    title: '더 있었으면 하는\n기능이 있나요?',
    hint: '떠오르는 대로 적어주세요',
    placeholder: '편하게 적어주세요',
  },
  CHANNEL_QUESTION,
];
