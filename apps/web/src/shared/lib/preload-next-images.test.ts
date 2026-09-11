// preloadImages — next/image가 만들 최적화 주소·srcSet 그대로 브라우저에 미리 받게 한다
import { describe, expect, it, vi } from 'vitest';

import { preloadImages } from './preload-next-images';

const mocks = vi.hoisted(() => ({ preload: vi.fn() }));
vi.mock('react-dom', () => ({ preload: mocks.preload }));

describe('preloadImages', () => {
  it('그림마다 next/image 최적화 주소와 srcSet으로 preload를 부른다', () => {
    preloadImages([
      { src: '/images/character/landy-point.webp', width: 150, height: 150 },
    ]);

    expect(mocks.preload).toHaveBeenCalledTimes(1);
    const [href, options] = mocks.preload.mock.calls[0];
    expect(href).toContain(
      '/_next/image?url=%2Fimages%2Fcharacter%2Flandy-point.webp',
    );
    expect(options.as).toBe('image');
    expect(options.imageSrcSet).toContain('2x');
  });
});
