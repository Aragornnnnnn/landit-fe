// 홈에서 프리미엄 프리뷰가 지금 무엇을 보여 줄지 정한다 — 앱을 새로 열어도 안내 없이 마지막 단계 다음부터 이어 간다
import type { PreviewScreen } from '@/features/premium-preview/model/preview-step';

type HomePreviewView = 'none' | 'tutorial' | 'card';

/**
 * @param cleared 오늘 카드를 끝냈는가 — 뒤집기·무료 표현은 끝낸 카드에서만 할 수 있다
 * @param showerHold 돌아온 순간의 동전 연출이 아직 도는가
 */
export const homePreviewViewOf = ({
  screen,
  cleared,
  showerHold,
}: {
  screen: PreviewScreen;
  cleared: boolean;
  showerHold: boolean;
}): HomePreviewView => {
  if (screen === 'none') return 'none';
  if (screen === 'tutorial') return showerHold ? 'none' : 'tutorial';
  // 뒤집기·무료 표현 — 날이 바뀌어 오늘 카드가 램프면 다음 대화를 끝낼 때까지 쉰다
  return cleared ? 'card' : 'none';
};
