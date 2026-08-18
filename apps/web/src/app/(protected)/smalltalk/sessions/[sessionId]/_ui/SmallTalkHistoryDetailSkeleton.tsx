// 지난 스몰톡 상세 로딩 스켈레톤 — 통계 카드와 표현 목록 자리를 먼저 잡아, 도착 후 화면이 튀지 않게 한다
import { ExpressionListSkeleton } from '@/features/expression/ui/ExpressionListSkeleton';

export const SmallTalkHistoryDetailSkeleton = () => (
  <div
    role="status"
    aria-label="표현을 불러오는 중"
    className="min-h-0 flex-1 overflow-hidden pb-6"
  >
    {/* 통계 카드 자리 — 라벨 위, 값 아래 세 칸 */}
    <div className="px-5 pt-1 pb-4">
      <div className="flex animate-pulse items-center rounded-2xl bg-card px-5 py-3.5 shadow-sm">
        {[0, 1, 2].map((cell) => (
          <div key={cell} className="flex flex-1 items-center">
            {cell > 0 && <div className="h-8 w-px shrink-0 bg-border" />}
            <div className="flex flex-1 flex-col items-center">
              <div className="h-[13px] w-12 rounded bg-secondary" />
              <div className="mt-2 h-[18px] w-14 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* 표현 목록 자리 — 스몰톡은 표현이 둘이다 */}
    <ExpressionListSkeleton rows={2} />
  </div>
);
