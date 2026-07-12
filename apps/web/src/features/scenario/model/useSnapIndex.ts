// 스냅 스크롤 컨테이너에서 중앙에 가장 가까운 자식의 인덱스를 추적한다 — 자식 높이가 제각각이어도 동작
import { useRef, useState } from 'react';

export const useSnapIndex = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const center = el.scrollTop + el.clientHeight / 2;
    let closest = 0;
    let closestDistance = Infinity;
    [...el.children].forEach((child, index) => {
      const item = child as HTMLElement;
      const distance = Math.abs(
        item.offsetTop + item.offsetHeight / 2 - center,
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    setActiveIndex(closest);
  };

  return { scrollRef, activeIndex, onScroll };
};
