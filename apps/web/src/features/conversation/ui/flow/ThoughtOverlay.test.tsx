// ThoughtOverlay — 속마음이 뜨기 전에 래디 그림(구슬·표정 셋)을 미리 받아 두는 계약을 검증한다
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ThoughtOverlay } from './ThoughtOverlay';

afterEach(() => cleanup());

const preloadedImages = () =>
  [
    ...document.head.querySelectorAll<HTMLLinkElement>(
      'link[rel="preload"][as="image"]',
    ),
  ].map((link) => link.getAttribute('href'));

describe('ThoughtOverlay', () => {
  it('속마음이 뜨기 전부터 구슬 래디와 세 표정 래디 그림을 미리 받아 둔다 — 뜨는 순간·바뀌는 순간 래디 자리가 비지 않게', () => {
    render(<ThoughtOverlay thought={null} />);

    expect(preloadedImages()).toEqual(
      expect.arrayContaining([
        '/images/character/landy-orb.webp',
        '/images/character/landy-good.webp',
        '/images/character/landy-normal.webp',
        '/images/character/landy-bad.webp',
      ]),
    );
  });
});
