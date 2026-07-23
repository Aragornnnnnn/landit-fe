// 경로 → Page Viewed 속성 매핑 검증 — 동적 세그먼트 정규화와 홈 복귀 신호 해석이 계약이다
import { describe, expect, it } from 'vitest';

import { toPageView } from './page-view';

const pv = (pathname: string, search = '') =>
  toPageView(pathname, new URLSearchParams(search));

describe('toPageView', () => {
  it('정적 페이지를 page_name으로 매핑한다', () => {
    expect(pv('/login')).toEqual({ page_name: 'login', path: '/login' });
    expect(pv('/onboarding')).toEqual({
      page_name: 'onboarding',
      path: '/onboarding',
    });
    expect(pv('/me')).toEqual({ page_name: 'me', path: '/me' });
  });

  it('홈 복귀 쿼리(flip·card·just)를 return_reason으로 해석한다', () => {
    expect(pv('/home')).toEqual({ page_name: 'home', path: '/home' });
    expect(pv('/home', 'flip=3&just=1')).toEqual({
      page_name: 'home',
      path: '/home',
      return_reason: 'flip',
      scenario_id: 3,
    });
    expect(pv('/home', 'card=7')).toEqual({
      page_name: 'home',
      path: '/home',
      return_reason: 'card',
      scenario_id: 7,
    });
    expect(pv('/home', 'just=1')).toEqual({
      page_name: 'home',
      path: '/home',
      return_reason: 'just',
    });
    expect(pv('/home', 'just=7')).toEqual({
      page_name: 'home',
      path: '/home',
      return_reason: 'just',
      scenario_id: 7,
    });
  });

  it('복귀 쿼리 값이 비어 있으면 scenario_id 없이 return_reason만 남긴다', () => {
    expect(pv('/home', 'card=')).toEqual({
      page_name: 'home',
      path: '/home',
      return_reason: 'card',
    });
  });

  it('대화 동적 세그먼트를 page_name conversation + scenario_id로 정규화한다', () => {
    expect(pv('/conversation/12')).toEqual({
      page_name: 'conversation',
      path: '/conversation/12',
      scenario_id: 12,
    });
  });

  it('표현 분기·학습 경로를 각각 정규화한다', () => {
    expect(pv('/expressions/3/branch')).toEqual({
      page_name: 'expression_list',
      path: '/expressions/3/branch',
      scenario_id: 3,
    });
    expect(pv('/expressions/3/45')).toEqual({
      page_name: 'expression_learning',
      path: '/expressions/3/45',
      scenario_id: 3,
      expression_id: 45,
    });
  });

  it('OAuth 콜백은 provider를 이벤트명이 아닌 경로로만 남긴다', () => {
    expect(pv('/auth/kakao/callback')).toEqual({
      page_name: 'auth_callback',
      path: '/auth/kakao/callback',
    });
  });

  it('루트·개발용 경로는 계측하지 않는다', () => {
    expect(pv('/')).toBeNull();
    expect(pv('/dev')).toBeNull();
  });

  it('알 수 없는 경로는 pathname을 page_name으로 쓰되 숫자 세그먼트는 :id로 치환한다', () => {
    expect(pv('/whatever')).toEqual({
      page_name: '/whatever',
      path: '/whatever',
    });
    expect(pv('/coaching/123')).toEqual({
      page_name: '/coaching/:id',
      path: '/coaching/123',
    });
  });
});
