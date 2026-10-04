// 시나리오 카드 로딩 스켈레톤 — 완료 카드(ScenarioCard 앞면)와 자리·크기를 맞춰 도착할 때 튀지 않게 한다
// 글자 자리는 같은 글자 크기의 투명 글자에 배경을 깔아, 줄 높이를 숫자로 따라 적지 않는다
import { CardShadow, CardStage } from './card/CardStage';

const Line = ({ children }: { children: string }) => (
  <span className="animate-skeleton-flow rounded-md box-decoration-clone text-transparent select-none">
    {children}
  </span>
);

export const ScenarioCardSkeleton = () => (
  <CardStage>
    <CardShadow />
    <div
      role="status"
      aria-label="카드 불러오는 중"
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-md"
    >
      {/* 안의 자리표시 글자는 눈에만 안 보일 뿐 읽히므로 통째로 감춘다 — 상태는 바깥 이름표가 알린다 */}
      <div aria-hidden className="flex min-h-0 flex-1 flex-col">
        <div className="animate-skeleton-flow relative min-h-0 w-full flex-1">
          {/* 별점 배지·기록 알약 자리 */}
          <span className="absolute top-3 left-3 h-10 w-[100px] rounded-full bg-border/60" />
          <span className="absolute top-[15px] right-3 h-[34px] w-[60px] rounded-full bg-border/60" />
        </div>

        <div className="flex flex-none flex-col gap-2 px-5 pt-3 pb-1">
          <div>
            <p className="text-xl leading-snug font-extrabold">
              <Line>카페에서 커피 주문하기</Line>
            </p>
            <p className="mt-1.5 text-sm leading-relaxed font-medium">
              <Line>
                단골 카페에서 처음 보는 직원에게 마실 것을 주문해 보는 대화예요
              </Line>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm font-bold">
                <Line>원어민 표현</Line>
                <Line>0/0 완료</Line>
              </div>
              <div className="animate-skeleton-flow h-1.5 w-full rounded-full" />
              <div className="animate-skeleton-flow h-12 w-full rounded-lg" />
            </div>
            <div className="flex h-12 items-center justify-center text-sm font-semibold">
              <Line>다시 대화하기</Line>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CardStage>
);
