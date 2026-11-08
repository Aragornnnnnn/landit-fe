// 폰 화면 바꾸기 검증 — 스크롤하는 만큼 다음 화면이 정한 자리에서 원으로 퍼져 번져 들어오고, 되돌리면 다시 오므라든다. 두 화면 모두 처음부터 문서에 있다
// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ScreenSwap, type Transition } from './ScreenSwap';

// next/image는 테스트 환경에서 그릴 수 없어 같은 속성의 img로 바꾼다
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 테스트에서 next/image 대신 그리는 자리 표시
    <img alt={alt} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderSwap = (
  transition: Transition = { type: 'spread', origin: { x: 50, y: 91 } },
) =>
  render(
    <div data-phone-stage>
      <ScreenSwap
        first={{ src: '/explain.webp', alt: '표현 설명 화면' }}
        next={{ src: '/pron.webp', alt: '발음 결과 화면' }}
        transition={transition}
      />
    </div>,
  );

/** 판 가운데가 화면 높이의 몇 % 지점에 오도록 스크롤했다고 친다 */
const scrollPhoneTo = (container: HTMLElement, ratio: number) => {
  const stage = container.firstElementChild as HTMLElement;
  stage.getBoundingClientRect = () =>
    ({ top: window.innerHeight * ratio - 300, height: 600 }) as DOMRect;
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
};

const nextLayer = () =>
  screen.getByAltText('발음 결과 화면').parentElement as HTMLElement;
const firstLayer = () =>
  screen.getByAltText('표현 설명 화면').parentElement as HTMLElement;

describe('ScreenSwap', () => {
  it('폰이 화면 가운데에 오기 전엔 두 화면 모두 문서에 있고 다음 화면은 마스크에 다 가려 있다', () => {
    // Given 첫 그리기 때 폰 가운데가 아직 화면 가운데 아래에 있다
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: window.innerHeight * 0.8 - 300,
      height: 600,
    } as DOMRect);

    renderSwap();

    expect(screen.getByAltText('표현 설명 화면')).toBeTruthy();
    expect(nextLayer().style.maskImage).toBe(
      'linear-gradient(transparent, transparent)',
    );
  });

  it('폰이 화면 가운데를 지나 위쪽으로 가면 정한 자리에서 퍼진 원이 다음 화면을 다 드러낸다', () => {
    // Given
    const { container } = renderSwap();

    // When 폰 가운데가 화면 가운데를 지나 20% 높이까지 올라왔다
    scrollPhoneTo(container, 0.2);

    // Then
    expect(nextLayer().style.maskImage).toBe('none');
  });

  it('스크롤을 되돌리면 다시 첫 화면으로 돌아간다', () => {
    // Given 다음 화면이 보이던 상태에서
    const { container } = renderSwap();
    scrollPhoneTo(container, 0.2);

    // When 폰을 다시 화면 가운데 아래로 내렸다
    scrollPhoneTo(container, 0.7);

    // Then
    expect(nextLayer().style.maskImage).toBe(
      'linear-gradient(transparent, transparent)',
    );
  });

  it('좌우로 넘기는 전환이면 첫 화면이 왼쪽으로 나가고 다음 화면이 오른쪽에서 들어온다', () => {
    // Given
    const { container } = renderSwap({ type: 'slide' });
    scrollPhoneTo(container, 0.8);
    expect(nextLayer().style.transform).toBe('translateX(100%)');

    // When
    scrollPhoneTo(container, 0.2);

    // Then
    expect(firstLayer().style.transform).toBe('translateX(-100%)');
    expect(nextLayer().style.transform).toBe('translateX(0%)');
  });
});
