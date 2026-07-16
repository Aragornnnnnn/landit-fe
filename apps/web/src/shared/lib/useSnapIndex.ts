// 스냅 스크롤 컨테이너에서 중앙에 가장 가까운 자식의 인덱스를 추적한다 — 가로/세로 겸용, 자식 크기가 제각각이어도 동작
import { useRef, useState } from 'react';

export const useSnapIndex = (axis: 'x' | 'y' = 'y') => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // 스크롤 이벤트마다가 아니라 프레임당 한 번만 계산한다 — 관성 스크롤 중 불필요한 순회·리렌더 방지
  const onScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = scrollRef.current;
      if (!el) return;

      // getBoundingClientRect 기준이라 offsetParent가 무엇이든(데스크톱 중앙 정렬 등) 좌표가 어긋나지 않는다
      const rect = el.getBoundingClientRect();
      const center =
        axis === 'x'
          ? rect.left + el.clientWidth / 2
          : rect.top + el.clientHeight / 2;

      let closest = 0;
      let closestDistance = Infinity;
      [...el.children].forEach((child, index) => {
        const childRect = (child as HTMLElement).getBoundingClientRect();
        const childCenter =
          axis === 'x'
            ? childRect.left + childRect.width / 2
            : childRect.top + childRect.height / 2;
        const distance = Math.abs(childCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = index;
        }
      });
      setActiveIndex(closest);
    });
  };

  return { scrollRef, activeIndex, onScroll };
};
