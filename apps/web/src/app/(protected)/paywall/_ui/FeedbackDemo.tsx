'use client';

// 대화 피드백 데모 — 스크롤로 넘기는 피드백 카드의 화면들. 한 장에 한 가지만 보여 준다.
// ① 대화마다 다섯 가지 지표 점수와 개선점 ② 더 자연스러운 말 교정과, 지난번 문장과 나란히 놓은 자주 하는 실수.
// 환급 페이월의 상세 피드백 다섯 장 — 잘한 턴, 고칠 턴, 원어민 이해도 총평, 나아진 점, 배운 표현 사용.
// 문구와 구성은 실제 시나리오 총평·상세 분석·스몰톡 요약 화면과 같다
import type { CSSProperties } from 'react';

import { SparklesIcon } from '@/shared/ui/Icons';

import { appear, DemoScreen, type DemoProps } from './DemoScreen';

/** 장면 둘 — 먼저 나오는 것, 이어서 나오는 것 */
const FIRST = 0;
const NEXT = 1;

/** 시나리오 총평 「이번 대화에서」 — 영역 이름은 실제 총평 카드와 같다 */
const AREAS = [
  { label: '상황 대처 능력', score: 82 },
  { label: '어휘력', score: 64 },
  { label: '문법', score: 58 },
  { label: '문장 완성도', score: 71 },
  { label: '대화 매너', score: 90 },
];

const Card = ({
  title,
  className = '',
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`mx-5 rounded-2xl bg-card px-5 py-4 shadow-[0_2px_10px_rgba(51,38,26,0.08)] ${className}`}
  >
    <p className="text-[15px] font-extrabold text-primary">{title}</p>
    {children}
  </div>
);

/** 실수 기억 카드 — 지난번 문장(틀린 곳 빨간 줄)과 오늘 문장을 나란히 놓는다 */
const GrowthCard = ({
  succeeded,
  pattern,
  before,
  today,
  className,
}: {
  succeeded: boolean;
  pattern: string;
  before: [string, string, string];
  today: [string, string, string];
  className: string;
}) => (
  <Card
    title={
      succeeded ? `지난번엔 헷갈렸던 ${pattern}` : `아직 헷갈리는 ${pattern}`
    }
    className={className}
  >
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-secondary px-4 py-3 text-[15px]">
      <p className="flex gap-3 text-muted-foreground">
        <span className="w-10 shrink-0 text-[13px]">9/28</span>
        <span>
          {before[0]}
          <span className="font-bold text-destructive line-through">
            {before[1]}
          </span>
          {before[2]}
        </span>
      </p>
      <p className="flex gap-3 font-bold text-foreground">
        <span className="w-10 shrink-0 text-[13px] font-normal text-muted-foreground">
          오늘
        </span>
        <span>
          {today[0]}
          <span className={succeeded ? 'text-success' : 'text-destructive'}>
            {today[1]}
          </span>
          {today[2]}
        </span>
      </p>
    </div>
    <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
      {succeeded
        ? '지난번엔 헷갈렸는데, 오늘은 맞았어요.'
        : '지난번에 이어 오늘도 헷갈렸어요. 상세 피드백에서 다시 볼 수 있어요.'}
    </p>
  </Card>
);

const Heading = ({ children }: { children: React.ReactNode }) => (
  <p className="px-6 pt-6 text-[22px] font-bold text-foreground">{children}</p>
);

/** ① 대화마다 다섯 가지로 분석 — 점수가 차오르고, 다음에 나아질 점이 한 줄 붙는다 */
export const AnalysisDemo = ({ step, width }: DemoProps) => (
  <DemoScreen width={width}>
    <Heading>대화 총평</Heading>
    <Card title="이번 대화에서" className="mt-4">
      <div className="mt-3 flex flex-col gap-2.5">
        {AREAS.map((area, index) => (
          <div key={area.label}>
            <div className="flex justify-between text-[15px]">
              <span className="text-muted-foreground">{area.label}</span>
              <span className="font-extrabold text-primary">
                {area.score}점
              </span>
            </div>
            <span className="mt-1 block h-2.5 rounded-full bg-secondary">
              <span
                className={`block h-full rounded-full bg-primary ${step === FIRST ? 'animate-bar-fill' : ''}`}
                style={
                  {
                    width: `${area.score}%`,
                    '--bar-width': `${area.score}%`,
                    '--i': index,
                  } as CSSProperties
                }
              />
            </span>
          </div>
        ))}
      </div>
    </Card>
    {/* 실제 총평 카드처럼 점수 아래에 다음에 나아질 점 */}
    <div
      className={`mx-5 mt-3 rounded-2xl bg-[#faf2e9] px-5 py-4 ${appear(step >= NEXT)}`}
    >
      <p className="text-[15px] font-extrabold text-[#c8641f]">
        이것만 고치면 돼요
      </p>
      <p className="mt-1 text-base leading-[1.6] text-foreground">
        단수·복수가 가장 아쉬웠어요. 둘 이상이면 끝에 -s를 붙여 보세요.
      </p>
    </div>
  </DemoScreen>
);

/** ② 자주 하는 실수 교정 — 내 말을 더 자연스럽게 고치고, 지난번에도 했던 실수라고 짚는다 */
export const MistakeDemo = ({ step, width }: DemoProps) => (
  <DemoScreen width={width}>
    <div className="flex flex-col gap-2 px-5 pt-6">
      <p className="max-w-[85%] self-start rounded-2xl rounded-bl-[6px] bg-card px-4 py-2.5 text-base text-foreground shadow-[0_2px_8px_rgba(51,38,26,0.08)]">
        Does your sister work out?
      </p>
      <p className="max-w-[85%] self-end rounded-2xl rounded-br-[6px] bg-primary px-4 py-2.5 text-base font-bold text-primary-foreground">
        Yes, she go to the gym every day.
      </p>
      <div
        className={`max-w-[92%] self-end rounded-2xl bg-success/10 px-4 py-3 ${step === FIRST ? 'animate-reveal-up' : ''}`}
        style={{ '--i': 4 } as CSSProperties}
      >
        <p className="flex items-center gap-1 text-[13px] font-semibold text-success">
          <SparklesIcon size={14} />
          이렇게 말하면 더 자연스러워요
        </p>
        <p className="mt-1 text-base font-bold text-success">
          Yes, she goes to the gym every day.
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          주어가 she면 동사에 -s를 붙여요.
        </p>
      </div>
    </div>
    <GrowthCard
      succeeded={false}
      pattern="3인칭 단수 -s"
      before={['He ', 'like', ' coffee.']}
      today={['She ', 'go', ' to the gym.']}
      className={`mt-4 ${appear(step >= NEXT)}`}
    />
  </DemoScreen>
);

/** 상세 분석 머리 — 실제 화면의 「상세 분석」 제목 줄 */
const DetailHeader = () => (
  <p className="pt-5 text-center text-[17px] font-bold text-foreground">
    상세 분석
  </p>
);

/** 상대 말과 내 말 한 쌍 — 상세 분석의 「질문」「내 답변」 */
const Exchange = ({ partner, mine }: { partner: string; mine: string }) => (
  <div className="flex flex-col gap-2 px-5">
    <p className="text-[13px] text-muted-foreground">질문</p>
    <p className="max-w-[88%] self-start rounded-2xl rounded-tl-[6px] bg-secondary px-4 py-3 text-[15px] leading-[1.5] text-foreground">
      {partner}
    </p>
    <p className="self-end text-[13px] text-muted-foreground">내 답변</p>
    <p className="max-w-[85%] self-end rounded-2xl rounded-tr-[6px] bg-primary px-4 py-3 text-[15px] leading-[1.5] font-bold text-primary-foreground">
      {mine}
    </p>
  </div>
);

/** 회색 상자에 담긴 풀이 한 단락 — 「한국어로 치면」「잘한 이유」 */
const Note = ({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) => (
  <div className="mx-5 mt-4">
    <p className="text-[13px] font-bold text-foreground">{label}</p>
    <div
      className={`mt-1.5 rounded-2xl px-4 py-3 text-[15px] leading-[1.55] ${strong ? 'bg-card font-bold text-foreground shadow-[0_2px_10px_rgba(51,38,26,0.08)]' : 'bg-secondary text-muted-foreground'}`}
    >
      {children}
    </div>
  </div>
);

/** ③ 잘한 문장 — 왜 잘 통했는지 짚는다 */
export const GoodTurnDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <DetailHeader />
    <p className="mt-4 flex items-center gap-1.5 px-5 text-lg font-extrabold text-success">
      <SparklesIcon size={18} />잘 통했어요
    </p>
    <div className="mt-3">
      <Exchange
        partner="Wait, you're my roommate? I'm Marco, an exchange student from Spain. Tell me about yourself!"
        mine="Hi Marco! I'm Junseo. I'm from Korea and I study computer science."
      />
    </div>
    <Note label="잘한 이유">
      이름, 출신, 전공을 한 번에 말해서 상대가 다음 질문을 이어 가기 쉬웠어요.
    </Note>
  </DemoScreen>
);

/** ④ 어색한 문장 — 이렇게 말하면 더 좋다고 고쳐 준다 */
export const BetterTurnDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <DetailHeader />
    <p className="mt-4 px-5 text-lg font-extrabold text-primary">
      한 단계 더 업그레이드해봐요
    </p>
    <div className="mt-3">
      <Exchange
        partner="Nice! So what do you do for fun? What got you into it?"
        mine="I like playing guitar. It is fun."
      />
    </div>
    <Note label="이렇게 하면 더 좋아요" strong>
      I&apos;m really into playing guitar. I got into it because my dad used to
      play.
    </Note>
  </DemoScreen>
);

/** ⑤ 대화 전체 총평 — 원어민 이해도와 한 줄 평 */
export const SummaryDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <p className="pt-5 text-center text-[17px] font-bold text-foreground">
      입주 첫날, 룸메이트 Marco와 첫 만남
    </p>
    <div className="px-6 pt-6">
      <p aria-hidden="true" className="text-2xl text-[#f5a524]">
        ★★<span className="text-border">★</span>
      </p>
      <p className="mt-3 text-[24px] leading-[1.4] font-extrabold text-foreground">
        이제 새 룸메이트와 어색하지 않게 인사할 수 있어요!
      </p>
      <p className="mt-3 text-[15px] text-muted-foreground">
        원어민 이해도 72%
      </p>
      <span className="mt-2 block h-3 rounded-full bg-secondary">
        <span className="block h-full w-[72%] rounded-full bg-primary" />
      </span>
      <p className="mt-4 text-[15px] font-bold text-foreground">
        3번 중 <span className="text-primary">1번</span> 원어민처럼 말했어요
      </p>
    </div>
    <Card title="총평" className="mt-5">
      <p className="mt-2 text-[15px] leading-[1.6] text-foreground">
        자기소개는 이름·출신·전공을 한 번에 전해 좋았어요. 취미를 말할 때는
        이유를 한 문장 덧붙여 보세요.
      </p>
    </Card>
  </DemoScreen>
);

/** ⑥ 지난번보다 나아진 점 — 지난번에 틀린 문장과 오늘 맞힌 문장을 나란히 */
export const GrowthDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <Heading>지난번과 비교</Heading>
    <GrowthCard
      succeeded
      pattern="과거형"
      before={['I ', 'go', ' to Busan last summer.']}
      today={['I ', 'got', ' into it because my dad used to play.']}
      className="mt-4"
    />
  </DemoScreen>
);

/** 랜딧에서 배운 표현을 대화에서 쓴 기록 — 표현, 배운 날, 쓴 문장 */
const REUSED = [
  {
    expression: 'be into',
    learned: '10월 7일',
    sentence: "I'm really into playing guitar.",
  },
  {
    expression: 'get into',
    learned: '10월 7일',
    sentence: 'I got into it because my dad used to play.',
  },
  {
    expression: 'used to',
    learned: '10월 5일',
    sentence: 'My dad used to play.',
  },
];

/** ⑦ 배운 표현을 실제로 썼는지 — 대화에서 다시 쓴 표현을 짚는다 */
export const ReuseDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <Heading>배운 표현 사용</Heading>
    <Card title="랜딧에서 배운 표현을 실제로 사용했어요" className="mt-4">
      <ul className="mt-3 flex flex-col gap-4">
        {REUSED.map((item) => (
          <li key={item.expression}>
            <p className="flex items-center gap-2">
              <span className="rounded-md bg-[#faf2e9] px-2 py-0.5 text-[14px] font-bold text-primary">
                {item.expression}
              </span>
              <span className="text-[13px] text-muted-foreground">
                {item.learned} 시나리오
              </span>
            </p>
            <p className="mt-1.5 text-[15px] font-bold text-foreground">
              “{item.sentence}”
            </p>
          </li>
        ))}
      </ul>
    </Card>
  </DemoScreen>
);
