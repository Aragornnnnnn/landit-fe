// 뒤로가기 결정 로직 검증 — 탭 화면에서는 이중탭 종료 흐름, 그 외에는 히스토리/종료로 분기
import { describe, expect, it } from 'vitest';

import { decideBack } from './back-navigation';

describe('decideBack', () => {
  it('탭 화면에서 뒤로가기를 누르면 히스토리가 남아 있어도 종료 흐름으로 보낸다', () => {
    // 대화 왕복으로 스택이 오염돼 canGoBack이 true여도 이전 화면으로 돌아가지 않는다
    expect(decideBack('/scenario', true)).toBe('confirm-exit');
    expect(decideBack('/scenario', false)).toBe('confirm-exit');
  });

  it('탭이 늘어도 각 탭이 최상위로 취급된다', () => {
    // 스몰톡 탭에서 뒤로가기가 이전 화면으로 튀면 탭 사이를 되감게 된다
    expect(decideBack('/smalltalk', true)).toBe('confirm-exit');
    expect(decideBack('/smalltalk', false)).toBe('confirm-exit');
  });

  it('탭이 아닌 화면에서 뒤로 갈 곳이 있으면 히스토리를 되돌린다', () => {
    expect(decideBack('/conversation/scenario/3', true)).toBe('history-back');
    expect(decideBack('/expressions/3/5', true)).toBe('history-back');
  });

  it('탭이 아니면서 뒤로 갈 곳이 없으면 앱을 종료한다', () => {
    expect(decideBack('/login', false)).toBe('exit-app');
  });
});
