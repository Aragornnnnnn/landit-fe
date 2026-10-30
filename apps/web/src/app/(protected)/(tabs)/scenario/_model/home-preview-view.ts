// 홈에서 프리미엄 프리뷰가 지금 무엇을 보여 줄지 정한다 — 앱을 새로 열어도 안내 없이 마지막 단계 다음부터 이어 간다
import {
  isPreviewOver,
  type PreviewScreen,
  type PreviewStep,
} from '@/features/premium-preview/model/preview-step';

type HomePreviewView = 'none' | 'tutorial' | 'card';

/**
 * @param cleared 오늘 카드를 끝냈는가 — 뒤집기·무료 표현은 끝낸 카드에서만 할 수 있다
 * @param held 앞선 연출(돌아온 순간의 동전·이벤트 공지)이 아직 화면에 있는가
 */
export const homePreviewViewOf = ({
  screen,
  cleared,
  held,
}: {
  screen: PreviewScreen;
  cleared: boolean;
  held: boolean;
}): HomePreviewView => {
  if (screen === 'none') return 'none';
  if (screen === 'tutorial') return held ? 'none' : 'tutorial';
  // 뒤집기·무료 표현 — 날이 바뀌어 오늘 카드가 램프면 다음 대화를 끝낼 때까지 쉰다
  return cleared ? 'card' : 'none';
};

/**
 * 소감·리뷰 시트를 미룰까 — 튜토리얼이 남아 있거나, 이번 방문에 프리뷰를 진행했으면 미룬다.
 * 튜토리얼에서 바로 표현으로 이어지는 동안 띄우면 답을 받기 어렵고, 무료 표현을 누르는 순간 단계가 넘어가 표현 화면 직전에 번쩍 뜬다.
 * 무료 표현을 마치고 돌아오면 대화와 학습을 함께 묻고, 마치지 않고 홈에 다시 왔으면 그때 좀 전 대화를 묻는다 —
 * 좋았어요가 리뷰 요청의 문이라 영영 안 묻게 두지 않는다. 알림 동의는 여기 묶지 않는다
 *
 * @param deciding 프리뷰 대상인지 아직 모른다(구독 조회 중)
 * @param step 프리뷰 대상의 마지막 단계. 대상이 아니면 null
 * @param actedThisVisit 이번 홈 방문에 튜토리얼·카드 뒤집기·무료 표현 중 하나를 진행했다
 */
export const previewHoldsSatisfaction = ({
  deciding,
  step,
  actedThisVisit,
}: {
  deciding: boolean;
  step: PreviewStep | null;
  actedThisVisit: boolean;
}) =>
  deciding ||
  step === 'STARTED' ||
  (actedThisVisit && step !== null && !isPreviewOver(step));

/** 프리뷰를 시작했지만 끝내지 않았다 — 튜토리얼 뒤에서 멈췄다 */
export const previewUnfinished = (step: PreviewStep | null) =>
  step === 'TUTORIAL_DONE' || step === 'CARD_FLIPPED' || step === 'FREE_OPENED';
