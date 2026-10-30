// 결제자 설문 문항 — 프리미엄을 결제한 사람에게 편지로 묻는다. 형식은 questions.ts와 같다
import { CHANNEL_QUESTION, type Question } from './questions';

// 순서는 알고 싶은 순서 — 결제 이유를 맨 앞에 둬서 중간에 그만둬도 그 답은 남게 하고, 유입 경로는 가볍게 맨 뒤에
export const PAID_QUESTIONS: readonly Question[] = [
  {
    id: 'premium_reason',
    kind: 'multi',
    title: '프리미엄을 시작한\n이유가 무엇인가요?',
    // 페이월이 파는 것(환급·프리미엄 전용 기능)을 그대로 보기로 둔다 — 가장 많이 고른 것이 페이월에서 앞세울 것이 된다.
    // 시나리오는 무료라 결제 이유가 될 수 없어 뺐다. 써 보고 좋았던 기능은 뒤 문항이 따로 묻는다
    options: [
      '결제 금액 그대로 환급받을 수 있어서',
      '문장마다 자세히 피드백해줘서',
      '나에게 맞는 원어민 표현을 알려줘서',
      '원어민에 가까운 발음으로 교정해줘서',
      '스몰톡을 제한 없이 할 수 있어서',
    ],
    other: true,
  },
  {
    // 보기만으로는 같은 답 안의 사정이 안 갈린다 — 한두 문장이라도 받으면 진짜 이유가 보인다
    id: 'premium_reason_detail',
    kind: 'text',
    title: '그 이유를 조금 더\n들려주세요',
    hint: '결제를 결심한 순간을 떠올려 주셔도 좋아요',
    placeholder: '편하게 적어주세요',
  },
  {
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
    required: true,
  },
  CHANNEL_QUESTION,
];
