// WidgetPreviewCard — 설치 안내의 위젯 그림을 화면 언어의 판으로 보여 준다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { WidgetPreviewMedium, WidgetPreviewSmall } from './WidgetPreviewCard';

// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 그림 주소만 남긴다
vi.mock('next/image', () => ({
  default: ({ src }: { src: string | { src: string } }) => (
    // eslint-disable-next-line @next/next/no-img-element -- next/image 대역
    <img alt="" src={typeof src === 'string' ? src : src.src} />
  ),
}));

afterEach(cleanup);

const srcOf = () => screen.getByRole('presentation').getAttribute('src');

describe('WidgetPreviewCard', () => {
  it.each([
    ['2×2', WidgetPreviewSmall],
    ['4×2', WidgetPreviewMedium],
  ])('%s 그림은 한국어 화면이면 한국어판을 쓴다', (_, Preview) => {
    render(<Preview />);

    expect(srcOf()).not.toContain('/ja/');
  });

  it.each([
    ['2×2', WidgetPreviewSmall],
    ['4×2', WidgetPreviewMedium],
  ])('%s 그림은 일본어 화면이면 일본어판을 쓴다', (_, Preview) => {
    setTestLocale('ja');

    render(<Preview />);

    expect(srcOf()).toContain('/ja/');
  });
});
