'use client';

// 화면에 들어오면 data-inview를 켜는 섹션 — 안의 reveal-* 조각들이 globals.css의 CSS 애니메이션으로 연출된다
import type { ComponentProps } from 'react';

import { useInView } from '../_lib/useInView';

type RevealSectionProps = Omit<ComponentProps<'section'>, 'ref'>;

export const RevealSection = ({ children, ...props }: RevealSectionProps) => {
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <section ref={ref} data-inview={inView} {...props}>
      {children}
    </section>
  );
};
