// resolveTapKind의 탭 대상 판별과, 전역 리스너가 스크롤 영역 밖은 닿는 순간·안은 탭이 성립할 때만 울리는지 검증
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { GlobalHaptics, resolveTapKind } from './GlobalHaptics';
import { haptic } from './haptics';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(),
}));

const inDom = (html: string) => {
  document.body.innerHTML = html;
  return document.body;
};

describe('resolveTapKind', () => {
  it('버튼 안을 누르면 tap을 준다', () => {
    const root = inDom('<button><span id="t">확인</span></button>');
    expect(resolveTapKind(root.querySelector('#t'))).toBe('tap');
  });

  it('탭 대상이 아니면 null', () => {
    const root = inDom('<p id="t">그냥 텍스트</p>');
    expect(resolveTapKind(root.querySelector('#t'))).toBeNull();
  });

  it('data-haptic으로 진동 이름을 바꾼다', () => {
    const root = inDom('<button data-haptic="tick" id="t">다음 칸</button>');
    expect(resolveTapKind(root.querySelector('#t'))).toBe('tick');
  });

  it('진동 이름이 아닌 data-haptic 값(세기 이름 등)은 tap으로 떨어진다', () => {
    const root = inDom('<button data-haptic="medium" id="t">x</button>');
    expect(resolveTapKind(root.querySelector('#t'))).toBe('tap');
  });

  it('비활성 버튼은 진동을 주지 않는다', () => {
    const root = inDom('<button disabled id="t">확인</button>');
    expect(resolveTapKind(root.querySelector('#t'))).toBeNull();
  });

  it('비활성 버튼 안쪽의 data-haptic 요소도 진동을 주지 않는다', () => {
    const root = inDom(
      '<button disabled><span data-haptic="tick" id="t">x</span></button>',
    );
    expect(resolveTapKind(root.querySelector('#t'))).toBeNull();
  });

  it('data-no-haptic 영역 안은 제외한다', () => {
    const root = inDom(
      '<div data-no-haptic><button id="t">스크롤 핸들</button></div>',
    );
    expect(resolveTapKind(root.querySelector('#t'))).toBeNull();
  });
});

// 전역 탭 리스너 — 스크롤과 상관없는 버튼은 닿는 순간, 스크롤 영역 안의 버튼은 탭(click)이 성립할 때 울린다
describe('GlobalHaptics', () => {
  // 스로틀(같은 패턴 30ms)이 테스트끼리 막지 않게 시계를 테스트마다 크게 넘긴다
  let clock = 1_000_000;
  beforeEach(() => {
    clock += 10_000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.mocked(postToNative).mockReturnValue(true);
  });
  afterEach(cleanup);

  const sentPatterns = () =>
    vi
      .mocked(postToNative)
      .mock.calls.map(([message]) =>
        message.type === 'HAPTIC' ? message.pattern : message.type,
      );

  const pointer = (
    type: string,
    target: Element,
    init: PointerEventInit = {},
  ) => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        isPrimary: true,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        ...init,
      }),
    );
  };

  // 손가락·마우스 탭이 만드는 click은 detail이 1 이상이다 (키보드·코드로 보낸 click은 0)
  const tapClick = (target: Element) => {
    target.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }),
    );
  };

  // jsdom은 레이아웃이 없어 내용 크기를 직접 정해 스크롤되는 영역을 흉내 낸다
  const makeScrollable = (el: HTMLElement, axis: 'y' | 'x' = 'y') => {
    if (el !== document.documentElement) {
      el.style[axis === 'y' ? 'overflowY' : 'overflowX'] = 'auto';
    }
    const [content, box] =
      axis === 'y'
        ? (['scrollHeight', 'clientHeight'] as const)
        : (['scrollWidth', 'clientWidth'] as const);
    Object.defineProperty(el, content, { configurable: true, value: 2000 });
    Object.defineProperty(el, box, { configurable: true, value: 800 });
  };

  // jsdom은 touch-action을 계산하지 않아, 표시한 요소만 touch-action: none으로 보이게 한다
  const makeDraggable = (el: HTMLElement) => {
    el.dataset.testTouchNone = '';
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((node, pseudo) => {
      const style = original(node, pseudo);
      if (
        !(node instanceof HTMLElement) ||
        !('testTouchNone' in node.dataset)
      ) {
        return style;
      }
      return new Proxy(style, {
        get: (target, key) =>
          key === 'touchAction'
            ? 'none'
            : (target[key as keyof CSSStyleDeclaration] as unknown),
      });
    });
  };

  describe('스크롤과 상관없는 버튼', () => {
    it('닿는 순간 바로 울린다', () => {
      render(
        <>
          <GlobalHaptics />
          <button>확인</button>
        </>,
      );

      pointer('pointerdown', screen.getByRole('button', { name: '확인' }));

      expect(sentPatterns()).toEqual(['light']);
    });

    it('닿을 때 울렸으면 탭이 성립해도 다시 울리지 않는다', () => {
      render(
        <>
          <GlobalHaptics />
          <button>확인</button>
        </>,
      );
      const button = screen.getByRole('button', { name: '확인' });

      pointer('pointerdown', button);
      clock += 1_000;
      pointer('pointerup', button);
      tapClick(button);

      expect(sentPatterns()).toEqual(['light']);
    });

    it('스크롤 영역 안이라도 화면에 고정된 요소(하단 CTA 등) 안이면 바로 울린다', () => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="scroller">
            <div style={{ position: 'fixed' }}>
              <button>다음</button>
            </div>
          </div>
        </>,
      );
      makeScrollable(screen.getByTestId('scroller'));

      pointer('pointerdown', screen.getByRole('button', { name: '다음' }));

      expect(sentPatterns()).toEqual(['light']);
    });

    it('overflow가 auto여도 내용이 넘치지 않으면 스크롤 영역이 아니다', () => {
      render(
        <>
          <GlobalHaptics />
          <div style={{ overflow: 'auto' }}>
            <button>확인</button>
          </div>
        </>,
      );

      pointer('pointerdown', screen.getByRole('button', { name: '확인' }));

      expect(sentPatterns()).toEqual(['light']);
    });

    it('두 번째 손가락으로 닿은 건 울리지 않는다', () => {
      render(
        <>
          <GlobalHaptics />
          <button>확인</button>
        </>,
      );

      pointer('pointerdown', screen.getByRole('button', { name: '확인' }), {
        isPrimary: false,
        pointerId: 2,
      });

      expect(sentPatterns()).toEqual([]);
    });

    it('마우스 오른쪽·가운데 버튼으로 누른 건 울리지 않는다', () => {
      render(
        <>
          <GlobalHaptics />
          <button>확인</button>
        </>,
      );

      pointer('pointerdown', screen.getByRole('button', { name: '확인' }), {
        button: 2,
      });

      expect(sentPatterns()).toEqual([]);
    });

    it('탭 대상이 아닌 곳에 닿으면 울리지 않는다', () => {
      render(
        <>
          <GlobalHaptics />
          <p>그냥 글자</p>
        </>,
      );

      pointer('pointerdown', screen.getByText('그냥 글자'));

      expect(sentPatterns()).toEqual([]);
    });
  });

  describe('스크롤 영역 안의 버튼', () => {
    const renderInScroller = (onClick?: () => void) => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="scroller">
            <button onClick={onClick}>확인</button>
          </div>
        </>,
      );
      makeScrollable(screen.getByTestId('scroller'));
      return screen.getByRole('button', { name: '확인' });
    };

    it('닿기만 해서는 울리지 않는다 — 스크롤하려고 닿은 것일 수 있다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);

      expect(sentPatterns()).toEqual([]);
    });

    it('눌렀다 떼서 탭이 성립하면 한 번 울린다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      pointer('pointerup', button);
      tapClick(button);

      expect(sentPatterns()).toEqual(['light']);
    });

    it('가로로 스크롤되는 영역(캐러셀)도 스크롤 영역으로 본다', () => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="carousel">
            <button>카드</button>
          </div>
        </>,
      );
      makeScrollable(screen.getByTestId('carousel'), 'x');

      pointer('pointerdown', screen.getByRole('button', { name: '카드' }));

      expect(sentPatterns()).toEqual([]);
    });

    it('페이지 자체가 스크롤되면 그 안의 버튼도 스크롤 영역으로 본다', () => {
      makeScrollable(document.documentElement);
      render(
        <>
          <GlobalHaptics />
          <button>확인</button>
        </>,
      );

      pointer('pointerdown', screen.getByRole('button', { name: '확인' }));

      expect(sentPatterns()).toEqual([]);
      Reflect.deleteProperty(document.documentElement, 'scrollHeight');
      Reflect.deleteProperty(document.documentElement, 'clientHeight');
    });

    it('브라우저가 스크롤로 넘겨받아 포인터를 취소하면 울리지 않는다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      pointer('pointercancel', button);
      tapClick(button);

      expect(sentPatterns()).toEqual([]);
    });

    it('손가락이 조금 미끄러져도 브라우저가 탭으로 본 클릭이면 울린다 — 버튼 동작과 진동이 어긋나지 않게', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      pointer('pointermove', button, { clientX: 100, clientY: 108 });
      tapClick(button);

      expect(sentPatterns()).toEqual(['light']);
    });

    it('두 번째 손가락이 닿으면 대기 중인 틱을 버린다 — 핀치 같은 제스처다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      pointer('pointerdown', button, { isPrimary: false, pointerId: 2 });
      tapClick(button);

      expect(sentPatterns()).toEqual([]);
    });

    it('다른 손가락의 움직임·취소는 대기 중인 틱에 영향이 없다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      pointer('pointermove', button, { pointerId: 2, clientX: 300 });
      pointer('pointercancel', button, { pointerId: 2 });
      tapClick(button);

      expect(sentPatterns()).toEqual(['light']);
    });

    it('누름 뒤 키보드·코드로 온 클릭(detail 0)엔 울리지 않는다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      button.click();

      expect(sentPatterns()).toEqual([]);
    });

    it('누른 버튼 밖에서 뗀 클릭엔 울리지 않는다 — 버튼 동작도 일어나지 않는다', () => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="scroller">
            <button>확인</button>
            <button>취소</button>
          </div>
        </>,
      );
      makeScrollable(screen.getByTestId('scroller'));

      pointer('pointerdown', screen.getByRole('button', { name: '확인' }));
      tapClick(screen.getByRole('button', { name: '취소' }));
      tapClick(screen.getByTestId('scroller'));

      expect(sentPatterns()).toEqual([]);
    });

    it('버튼 안쪽 글자를 누르고 버튼에서 뗀 클릭은 탭이다', () => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="scroller">
            <button>
              <span>확인</span>
            </button>
          </div>
        </>,
      );
      makeScrollable(screen.getByTestId('scroller'));

      pointer('pointerdown', screen.getByText('확인'));
      tapClick(screen.getByRole('button', { name: '확인' }));

      expect(sentPatterns()).toEqual(['light']);
    });

    it('탭 대상이 아닌 곳을 누르면 앞서 누른 버튼의 틱은 사라진다', () => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="scroller">
            <button>확인</button>
            <p>그냥 글자</p>
          </div>
        </>,
      );
      makeScrollable(screen.getByTestId('scroller'));
      const button = screen.getByRole('button', { name: '확인' });

      pointer('pointerdown', button);
      pointer('pointerdown', screen.getByText('그냥 글자'));
      tapClick(button);

      expect(sentPatterns()).toEqual([]);
    });

    it('틱은 버튼 동작 안의 결과 진동보다 먼저 간다', () => {
      const button = renderInScroller(() => haptic('success'));

      pointer('pointerdown', button);
      tapClick(button);

      expect(sentPatterns()).toEqual(['light', 'success']);
    });

    it('틱은 한 번 누름에 한 번만 — 같은 누름에서 클릭이 또 와도 다시 울리지 않는다', () => {
      const button = renderInScroller();

      pointer('pointerdown', button);
      tapClick(button);
      clock += 1_000;
      tapClick(button);

      expect(sentPatterns()).toEqual(['light']);
    });
  });

  describe('끌기 요소(touch-action: none) 안의 버튼', () => {
    const renderDraggable = () => {
      render(
        <>
          <GlobalHaptics />
          <div data-testid="chips">
            <button>칩</button>
          </div>
        </>,
      );
      makeDraggable(screen.getByTestId('chips'));
      return screen.getByRole('button', { name: '칩' });
    };

    it('스크롤 영역 밖이어도 닿는 순간엔 울리지 않는다 — 끌기를 시작한 것일 수 있다', () => {
      const chip = renderDraggable();

      pointer('pointerdown', chip);

      expect(sentPatterns()).toEqual([]);
    });

    it('5px 안쪽으로만 움직이고 뗀 탭은 울린다', () => {
      const chip = renderDraggable();

      pointer('pointerdown', chip);
      pointer('pointermove', chip, { clientX: 103, clientY: 103 });
      tapClick(chip);

      expect(sentPatterns()).toEqual(['light']);
    });

    it('5px 이상 끌었으면 클릭이 따라와도 울리지 않는다 — touch-none 요소는 끌어도 브라우저가 클릭을 보낸다', () => {
      const chip = renderDraggable();

      pointer('pointerdown', chip);
      pointer('pointermove', chip, { clientX: 100, clientY: 105 });
      tapClick(chip);

      expect(sentPatterns()).toEqual([]);
    });
  });

  it('누르지 않고 온 클릭(키보드 Enter 등)은 울리지 않는다', () => {
    render(
      <>
        <GlobalHaptics />
        <button>확인</button>
      </>,
    );

    screen.getByRole('button', { name: '확인' }).click();

    expect(sentPatterns()).toEqual([]);
  });

  it('data-haptic으로 정한 진동 이름이 그 이름의 실제 진동으로 울린다', () => {
    render(
      <>
        <GlobalHaptics />
        <button data-haptic="tick">다음 칸</button>
      </>,
    );

    pointer('pointerdown', screen.getByRole('button', { name: '다음 칸' }));

    expect(sentPatterns()).toEqual(['selection']);
  });
});
