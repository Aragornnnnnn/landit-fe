// 이번 방문에 이벤트 공지를 건너뛸까 — 한 번 건너뛰기로 정하면 그 방문 동안은 고정한다.
// 프리뷰가 그 자리에서 끝나 차례가 꺼져도 같은 방문에 공지가 갑자기 튀어나오지 않게
import { useState } from 'react';

import { skipsEventPopup } from './event-popup-order';

export const useEventPopupSkip = (
  turns: Parameters<typeof skipsEventPopup>[0],
) => {
  const skipsNow = skipsEventPopup(turns);
  const [skipped, setSkipped] = useState(skipsNow);
  // 렌더 중에 이전 렌더의 값을 이어 받는 React 패턴 — 한 번 켜지면 끄지 않는다
  if (skipsNow && !skipped) setSkipped(true);
  return skipsNow || skipped;
};
