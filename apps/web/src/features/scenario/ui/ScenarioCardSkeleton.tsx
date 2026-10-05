// 시나리오 카드 로딩 스켈레톤 — 어느 카드든 공통인 골격(사진·제목·설명·버튼)만 그린다.
// 별점·기록·표현 진행처럼 카드마다 있다 없다 하는 건 그리지 않는다 — 응답 전에는 알 수 없어 틀리게 그리게 된다.
// 글자 자리는 같은 글자 크기의 투명 글자에 배경을 깔아, 줄 높이를 숫자로 따라 적지 않는다
import { CardStage } from './card/CardStage';

const Line = ({ children }: { children: string }) => (
  <span className="animate-skeleton-flow rounded-md box-decoration-clone text-transparent select-none">
    {children}
  </span>
);

export const ScenarioCardSkeleton = () => (
  <CardStage>
    <div
      role="status"
      aria-label="카드 불러오는 중"
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-md"
    >
      {/* 안의 자리표시 글자는 눈에만 안 보일 뿐 읽히므로 통째로 감춘다 — 상태는 바깥 이름표가 알린다 */}
      <div aria-hidden className="flex min-h-0 flex-1 flex-col">
        <div className="animate-skeleton-flow min-h-0 w-full flex-1" />

        <div className="flex flex-none flex-col gap-3 px-5 pt-3 pb-5">
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
          <div className="animate-skeleton-flow h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </CardStage>
);
