'use client';

// 대화 피드백 데모 두 장 — 스크롤로 넘기는 피드백 카드의 화면들. 한 장에 한 가지만 보여 준다.
// ① 대화마다 다섯 가지 지표 점수와 개선점 ② 더 자연스러운 말 교정과, 지난번 문장과 나란히 놓은 자주 하는 실수.
// 문구와 구성은 실제 시나리오 총평·스몰톡 요약 화면과 같다
import type { CSSProperties } from 'react';

import { SparklesIcon } from '@/shared/ui/Icons';

import { DemoScreen, type DemoProps } from './DemoScreen';

/** 장면 둘 — 먼저 나오는 것, 이어서 나오는 것 */
const FIRST = 0;
const NEXT = 1;
export const ANALYSIS_DURATIONS = [2200, 2600] as const;
export const MISTAKE_DURATIONS = [2200, 3000] as const;

/** 시나리오 총평 「이번 대화에서」 — 영역 이름은 실제 총평 카드와 같다 */
const AREAS = [
  { label: '상황 대처 능력', score: 82 },
  { label: '어휘력', score: 64 },
  { label: '문법', score: 58 },
  { label: '문장 완성도', score: 71 },
  { label: '대화 매너', score: 90 },
];

/** 장면이 오면 아래에서 떠오른다 */
const appear = (shown: boolean) =>
  shown
    ? 'translate-y-0 opacity-100 transition-[opacity,translate] duration-500'
    : 'translate-y-4 opacity-0';

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
