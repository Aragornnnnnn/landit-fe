// 요소가 화면에 들어왔는지 — 기본은 한 번 들어오면 true로 굳고 관찰을 끊는다(섹션 등장 연출의 방아쇠).
// once를 끄면 들어오고 나갈 때마다 따라 바뀐다 — 화면을 떠나면 멈춰야 하는 반복 연출에 쓴다
import { useState } from 'react';

/** 화면 아래 끝보다 조금 먼저 걸리게 — 완성된 모습이 한 번 보였다가 연출로 다시 나타나는 깜빡임이 없다 */
const ROOT_MARGIN = '0px 0px 10% 0px';

/** rootMargin — 관찰 범위. 기본은 화면 아래로 조금 넓힌 범위, 가운데 띠를 넘기면 가운데에 왔을 때 한 번 켜진다 */
export const useInView = <T extends Element>(
  rootMargin = ROOT_MARGIN,
  { once = true }: { once?: boolean } = {},
) => {
  const [inView, setInView] = useState(false);

  const ref = (node: T | null) => {
    if (!node || (once && inView)) return;
    // 관찰기가 없는 환경에선 연출을 건너뛰고 바로 보인 것으로 친다
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!once) {
          setInView(entry?.isIntersecting ?? false);
          return;
        }
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  };

  return { ref, inView };
};
