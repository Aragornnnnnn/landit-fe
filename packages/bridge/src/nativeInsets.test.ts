// 셸 inset 주입 스크립트 — 문서 루트가 있을 때와 나중에 생길 때 모두 변수를 세팅하는지 검증한다
import { describe, expect, it } from 'vitest';

import { buildNativeInsetsScript, NATIVE_INSET_VARS } from './nativeInsets';

// 주입 스크립트를 가짜 document 위에서 실행한다. 루트가 없으면 파서가 <html>을 붙이는 순간을 흉내 낼 수 있게 한다
const run = (hasRoot: boolean) => {
  const style = new Map<string, string>();
  const root = {
    style: { setProperty: (n: string, v: string) => style.set(n, v) },
  };
  const fakeDocument = { documentElement: hasRoot ? root : null };
  let mutate = () => {};
  class FakeMutationObserver {
    constructor(callback: (records: unknown[], observer: unknown) => void) {
      mutate = () => callback([], this);
    }
    observe() {}
    disconnect() {}
  }
  new Function(
    'document',
    'MutationObserver',
    buildNativeInsetsScript({ top: 24, bottom: 48 }),
  )(fakeDocument, FakeMutationObserver);
  const attachRoot = () => {
    fakeDocument.documentElement = root;
    mutate();
  };
  return { style, attachRoot };
};

describe('buildNativeInsetsScript', () => {
  it('문서 루트가 있으면 상·하단 inset을 px 단위 변수로 세팅한다', () => {
    const { style } = run(true);

    expect(style.get(NATIVE_INSET_VARS.top)).toBe('24px');
    expect(style.get(NATIVE_INSET_VARS.bottom)).toBe('48px');
  });

  // 로드 전 주입 시점엔 루트가 아직 없을 수 있다 — 첫 페인트 뒤에 값이 들어오면 레이아웃이 점프한다
  it('문서 루트가 나중에 생기면 그 순간 세팅한다', () => {
    const { style, attachRoot } = run(false);

    attachRoot();

    expect(style.get(NATIVE_INSET_VARS.bottom)).toBe('48px');
  });
});
