// 환급 화면 로딩 스켈레톤 — 그림·금액·내역 자리를 덩어리로 먼저 잡아, 도착 후 화면이 튀지 않게 한다
import { HistoryPlaceholderLines } from '@/features/reward/ui/RewardHistory';

// 흰 카드 없이 배경 위에 바로 놓여 기본 색으로는 묻힌다 — 한 단계 진한 바탕에 빛을 흘린다
const BLOCK_CLASS = 'animate-skeleton-flow bg-border!';

export const RewardSkeleton = () => (
  <div
    role="status"
    aria-label="환급 정보를 불러오는 중"
    className="px-5 pt-4 pb-8"
  >
    <div className="flex flex-col items-center">
      {/* 돈통 그림 자리 */}
      <div className={`h-[180px] w-[240px] rounded-3xl ${BLOCK_CLASS}`} />
      {/* 꼬리표·금액·안내 문구가 놓일 자리를 한 덩어리로 */}
      <div className={`mt-4 h-[90px] w-56 rounded-2xl ${BLOCK_CLASS}`} />
    </div>

    <HistoryPlaceholderLines />
  </div>
);
