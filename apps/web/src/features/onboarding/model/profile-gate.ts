// 기존 유저 게이트가 물을지 정하기 — 온보딩을 이미 마쳐서 스텝으로는 못 물은 것(배울 영어)을 모은다.
// 답했는지는 서버가 판단한다 (조회 응답의 null이 곧 "아직 안 답함"). 기기에는 따로 남기지 않는다 —
// 두 군데에 답이 있으면 다른 기기에서 바꿨을 때 어느 쪽이 진실인지 알 수 없다.
// 영어 수준은 더 이상 묻지 않는다 — 첫 대화로 BE가 매기고, 손으로 바꾸면 그 뒤 평가가 적용되지 않는다 (landit-be #169)
import type { AccentLocale } from '@landit/analytics';

/**
 * 배울 영어를 물어야 하는가.
 *
 * @param accentLocale 값 있음 = 답했다, null = 안 답했다, undefined = 아직 모른다(조회 전이거나 실패).
 *   모르면 묻지 않는다 — 이미 답한 사람에게 또 묻는 쪽이 한 번 덜 묻는 쪽보다 나쁘다
 */
export const shouldAskAccent = (
  accentLocale: AccentLocale | null | undefined,
) => accentLocale === null;
