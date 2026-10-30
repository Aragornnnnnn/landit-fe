// 결제자 설문 문항 — 환급 챌린지를 결제한 사람에게 편지로 묻는다. 형식은 questions.ts와 같다
import { CHANNEL_QUESTION, type Question } from './questions';

export const PAID_QUESTIONS: readonly Question[] = [
  CHANNEL_QUESTION,
  {
    id: 'challenge_reason',
    kind: 'multi',
    title: '챌린지를 시작한\n이유가 무엇인가요?',
    options: [
      '조건을 채우면 환급받을 수 있어서',
      '꾸준히 할 동기가 필요해서',
      '무료로 써 보니 괜찮아서',
      '대화를 제한 없이 하고 싶어서',
    ],
    other: true,
  },
  {
    id: 'liked_features',
    kind: 'multi',
    title: '어떤 기능이 가장\n만족스러우세요?',
    options: [
      '시나리오 대화',
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
    hint: '작은 불편도 괜찮아요',
    placeholder: '편하게 적어주세요',
  },
  {
    id: 'wish',
    kind: 'text',
    title: '더 있었으면 하는\n기능이 있나요?',
    hint: '떠오르는 대로 적어주세요',
    placeholder: '편하게 적어주세요',
  },
];
