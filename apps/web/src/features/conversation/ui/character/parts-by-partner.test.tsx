// 생성 파츠의 층 계약 — 층을 나눠 그려도 전체 그림과 같은 그림이어야 한다
// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Partner } from '../../model/character-look';
import { LIMBS, PARTS, type PartLayer } from './parts-by-partner';

const PARTNERS: Partner[] = ['chloe', 'marco', 'teddy'];

// 층이 화면에 겹치는 순서 — PartnerCharacter가 이 순서로 쌓는다
const stackOf = (partner: Partner): PartLayer[] => [
  'torso',
  'head-back',
  'mouth',
  'head-front',
  ...LIMBS[partner],
];

// 마스크 정의 안의 경로는 그림이 아니다 — 그려지는 경로만 문서 순서로 모은다
const drawnPaths = (container: Element) =>
  [...container.querySelectorAll('path')]
    .filter((path) => !path.closest('mask'))
    .map((path) => path.getAttribute('d') ?? path.id);

describe('파츠 층 나누기', () => {
  afterEach(cleanup);

  it.each(PARTNERS)(
    '%s — 층을 순서대로 겹치면 전체 그림과 같은 경로가 같은 순서로 그려진다',
    (partner) => {
      // Given
      const Parts = PARTS[partner];
      const whole = drawnPaths(render(<Parts />).container);
      cleanup();

      // When
      const layered = stackOf(partner).flatMap((layer) => {
        const paths = drawnPaths(render(<Parts layer={layer} />).container);
        cleanup();
        return paths;
      });

      // Then
      expect(layered).toEqual(whole);
    },
  );

  it.each(PARTNERS)('%s — 입 층에는 입만 들어 있다', (partner) => {
    // Given
    const Parts = PARTS[partner];

    // When
    const { container } = render(<Parts layer="mouth" />);

    // Then
    expect(container.querySelector('#mouth')).not.toBeNull();
    expect(container.querySelector('#mouth-frown')).toBeNull();
    expect(container.querySelector('#eye-left')).toBeNull();
  });

  it.each(PARTNERS)(
    '%s — 찡그린 입은 입 앞 층에 있다 — 립싱크를 타면 안 된다',
    (partner) => {
      // Given
      const Parts = PARTS[partner];

      // When
      const { container } = render(<Parts layer="head-front" />);

      // Then
      expect(container.querySelector('#mouth-frown')).not.toBeNull();
    },
  );

  it.each(PARTNERS)(
    '%s — 층에는 머리 래퍼가 없다 — 머리 움직임은 층을 감싼 상자가 맡는다',
    (partner) => {
      // Given
      const Parts = PARTS[partner];

      // When
      const { container } = render(<Parts layer="head-back" />);

      // Then
      expect(container.querySelector('#head, #head-inner')).toBeNull();
    },
  );

  it.each(PARTNERS)(
    '%s — 층을 고르지 않으면 지금처럼 머리 래퍼까지 한 장으로 그린다',
    (partner) => {
      // Given
      const Parts = PARTS[partner];

      // When
      const { container } = render(<Parts />);

      // Then
      expect(
        container.querySelector('#head > #head-inner #mouth'),
      ).not.toBeNull();
    },
  );

  it.each(PARTNERS)(
    '%s — 층이 쓰는 마스크는 그 층 SVG 안에 있다 — 다른 층의 마스크를 빌려 쓰면 그 층이 빠질 때 구멍이 사라진다',
    (partner) => {
      // Given
      const Parts = PARTS[partner];

      for (const layer of stackOf(partner)) {
        // When
        const { container } = render(<Parts layer={layer} />);

        // Then
        const used = [...container.querySelectorAll('[mask]')].map(
          (node) => node.getAttribute('mask')?.match(/url\(#(.+)\)/)?.[1],
        );
        for (const id of used)
          expect(container.querySelector(`mask[id="${id}"]`)).not.toBeNull();
        cleanup();
      }
    },
  );

  it.each(PARTNERS)(
    '%s — 마스크 영역은 가리는 부위를 따라간다 — 고정된 큰 영역이면 층이 그만큼 커져 GPU 타일 메모리를 잡아먹는다',
    (partner) => {
      // Given
      const Parts = PARTS[partner];

      for (const layer of stackOf(partner)) {
        // When
        const { container } = render(<Parts layer={layer} />);

        // Then
        for (const mask of container.querySelectorAll('mask'))
          expect(mask.getAttribute('maskUnits')).not.toBe('userSpaceOnUse');
        cleanup();
      }
    },
  );
});
