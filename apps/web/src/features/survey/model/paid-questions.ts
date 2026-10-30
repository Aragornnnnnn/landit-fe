// 결제자 설문 문항 — 프리미엄을 결제한 사람에게 편지로 묻는다. 형식은 questions.ts와 같다
import { CHANNEL_QUESTION, type Question } from './questions';

export const PAID_QUESTIONS: readonly Question[] = [
  CHANNEL_QUESTION,
  {
    id: 'premium_reason',
    kind: 'multi',
    title: '프리미엄을 시작한\n이유가 무엇인가요?',
    // 랜딧 기능(페이월 비교표의 줄)을 하나씩 보기로 둔다 — 어느 혜택이 결제를 이끌었는지 본다
    options: [
      '조건을 채우면 환급받을 수 있어서',
      '꾸준히 할 동기가 필요해서',
      '매일 새로운 상황을 체험해볼 수 있어서',
      '문장마다 자세히 피드백해줘서',
      '나에게 맞는 원어민 표현을 알려줘서',
      '원어민에 가까운 발음으로 교정해줘서',
      '스몰톡을 제한 없이 할 수 있어서',
      '미국·영국·호주식 영어를 고를 수 있어서',
    ],
    other: true,
  },
  {
    id: 'liked_features',
    kind: 'multi',
    title: '어떤 기능이 가장\n만족스러우세요?',
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
    hint: '작은 불편도 괜찮아요',
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
];
