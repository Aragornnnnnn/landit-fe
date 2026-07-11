// 스크롤 발생 시 헤더 그림자 표시 여부를 추적하는 훅
import { useRef, useState } from 'react';

export function useScrollShadow() {
  const [hasShadow, setHasShadow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    setHasShadow((ref.current?.scrollTop ?? 0) > 0);
  };

  return { ref, onScroll, hasShadow };
}
