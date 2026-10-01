// 스크롤 영역 아래에 가려진 내용이 더 있는지 — 있으면 아래 가장자리를 흐려 더 내릴 수 있음을 알린다
import { useEffect, useRef, useState } from 'react';

// 소수점 스크롤로 끝에서 1px 못 미치게 멈춰도 끝으로 본다
const END_TOLERANCE_PX = 1;

export const hasMoreBelow = ({
  scrollTop,
  clientHeight,
  scrollHeight,
}: {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}) => scrollTop + clientHeight < scrollHeight - END_TOLERANCE_PX;

export const useMoreBelow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  const measure = () => {
    if (ref.current) setMoreBelow(hasMoreBelow(ref.current));
  };

  // 렌더마다 다시 잰다 — 수준 평가 카드처럼 늦게 채워지는 내용이 길이를 바꾼다. 값이 같으면 React가 다시 그리지 않는다
  useEffect(measure);

  return { ref, onScroll: measure, moreBelow };
};
