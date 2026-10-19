// 홈에서 첫 표현 투어가 지금 무엇을 보여 줄지 정한다
import type { TourScreen } from '@/features/tour/model/tour-step';

export type HomeTourView =
  'none' | 'resume' | 'challenge_intro' | 'card' | 'paywall';

/**
 * @param live 이번 앱 실행에서 투어를 이어 왔는가 — 아니면 이어하기 안내부터
 * @param cleared 오늘 카드를 끝냈는가 — 뒤집기·무료 표현은 끝낸 카드에서만 할 수 있다
 * @param showerHold 돌아온 순간의 동전 연출이 아직 도는가
 */
export const homeTourViewOf = ({
  screen,
  live,
  cleared,
  showerHold,
}: {
  screen: TourScreen;
  live: boolean;
  cleared: boolean;
  showerHold: boolean;
}): HomeTourView => {
  if (screen === 'none') return 'none';
  const needsCard = screen === 'flip_card' || screen === 'free_expression';
  if (needsCard && !cleared) return 'none';
  if (!live) return 'resume';
  if (screen === 'challenge_intro')
    return showerHold ? 'none' : 'challenge_intro';
  if (needsCard) return 'card';
  return 'paywall';
};
