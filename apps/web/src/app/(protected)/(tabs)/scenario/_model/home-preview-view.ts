// 홈에서 프리미엄 프리뷰가 지금 무엇을 보여 줄지 정한다 — 앱을 새로 열어도 안내 없이 마지막 단계 다음부터 이어 간다
import type {
  PreviewScreen,
  PreviewStep,
} from '@/features/premium-preview/model/preview-step';

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

/**
 * 홈의 다른 시트(소감·알림 동의)를 미룰까 — 프리뷰를 끝낼 때까지 미룬다. 무료 표현까지 마치고 돌아오면 그때 대화와 학습을 함께 묻는다.
 * 튜토리얼과 같이 뜨면 바로 표현으로 들어가 버려 답을 받기 어렵다
 *
 * @param deciding 프리뷰 대상인지 아직 모른다(구독 조회 중) — 모르는 사이 띄우면 튜토리얼이 뜨며 떴다 사라진다
 * @param step 프리뷰 대상의 마지막 단계. 대상이 아니면 null
 */
export const previewHoldsSheets = ({
  deciding,
  step,
}: {
  deciding: boolean;
  step: PreviewStep | null;
}) => deciding || (step !== null && step !== 'COMPLETED');
