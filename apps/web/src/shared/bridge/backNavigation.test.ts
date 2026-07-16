// 뒤로가기 결정 로직 검증 — 홈에서는 종료 확인, 그 외에는 히스토리/종료로 분기
import { describe, expect, it } from 'vitest';

import { decideBack } from './backNavigation';

describe('decideBack', () => {
  it('홈에서 뒤로가기를 누르면 히스토리가 남아 있어도 종료 확인을 띄운다', () => {
    // 대화 왕복으로 스택이 오염돼 canGoBack이 true여도 이전 화면으로 돌아가지 않는다
    expect(decideBack('/home', true)).toBe('exit-confirm');
    expect(decideBack('/home', false)).toBe('exit-confirm');
  });

  it('홈이 아닌 화면에서 뒤로 갈 곳이 있으면 히스토리를 되돌린다', () => {
    expect(decideBack('/conversation/3', true)).toBe('history-back');
    expect(decideBack('/expressions/3/5', true)).toBe('history-back');
  });

  it('홈이 아니면서 뒤로 갈 곳이 없으면 앱을 종료한다', () => {
    expect(decideBack('/login', false)).toBe('exit-app');
  });
});
