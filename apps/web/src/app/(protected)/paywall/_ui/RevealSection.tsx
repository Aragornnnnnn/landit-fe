'use client';

// 화면에 들어오면 data-inview를 켜는 섹션 — 안의 reveal-* 조각들이 globals.css의 CSS 애니메이션으로 연출된다
import type { ComponentProps } from 'react';

import { useInView } from '../_lib/useInView';

type RevealSectionProps = Omit<
  ComponentProps<'section'>,
  'ref' | 'children'
> & {
  /** 연출이 켜졌는지를 자식이 알아야 할 때(카운트업 등) — 렌더 함수로 받는다 */
  children: React.ReactNode | ((inView: boolean) => React.ReactNode);
};

export const RevealSection = ({ children, ...props }: RevealSectionProps) => {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section ref={ref} data-inview={inView} {...props}>
      {typeof children === 'function' ? children(inView) : children}
    </section>
  );
};
