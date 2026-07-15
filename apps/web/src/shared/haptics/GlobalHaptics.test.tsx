// resolveTapPattern — 탭 대상 판별과 data 속성 오버라이드·옵트아웃 검증
import { describe, expect, it } from 'vitest';

import { resolveTapPattern } from './GlobalHaptics';

const inDom = (html: string) => {
  document.body.innerHTML = html;
  return document.body;
};

describe('resolveTapPattern', () => {
  it('버튼 안을 누르면 selection 틱을 준다', () => {
    const root = inDom('<button><span id="t">확인</span></button>');
    expect(resolveTapPattern(root.querySelector('#t'))).toBe('selection');
  });

  it('탭 대상이 아니면 null', () => {
    const root = inDom('<p id="t">그냥 텍스트</p>');
    expect(resolveTapPattern(root.querySelector('#t'))).toBeNull();
  });

  it('data-haptic으로 패턴을 오버라이드한다', () => {
    const root = inDom('<button data-haptic="medium" id="t">뒤집기</button>');
    expect(resolveTapPattern(root.querySelector('#t'))).toBe('medium');
  });

  it('규격 밖 data-haptic 값은 selection으로 떨어진다', () => {
    const root = inDom('<button data-haptic="boom" id="t">x</button>');
    expect(resolveTapPattern(root.querySelector('#t'))).toBe('selection');
  });

  it('비활성 버튼은 진동을 주지 않는다', () => {
    const root = inDom('<button disabled id="t">확인</button>');
    expect(resolveTapPattern(root.querySelector('#t'))).toBeNull();
  });

  it('data-no-haptic 영역 안은 제외한다', () => {
    const root = inDom(
      '<div data-no-haptic><button id="t">스크롤 핸들</button></div>',
    );
    expect(resolveTapPattern(root.querySelector('#t'))).toBeNull();
  });
});
