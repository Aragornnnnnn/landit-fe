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
    expect(pv('/smalltalk')).toEqual({
      page_name: 'smalltalk',
      path: '/smalltalk',
    });
  });

  it('표현 완료 복귀(flip)를 return_reason으로 해석한다', () => {
    expect(pv('/scenario')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
    });
    expect(pv('/scenario', 'flip=3')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      return_reason: 'flip',
      scenario_id: 3,
    });
  });

  it('날짜가 붙으면 완료한 날을 다시 보는 것이다 — completed_date로 남기되 복귀 사유는 아니다', () => {
    expect(pv('/scenario', 'date=2026-07-29')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      completed_date: '2026-07-29',
    });
  });

  it('표현 완료 복귀(flip)에 날짜가 붙으면 completed_date도 함께 남긴다', () => {
    expect(pv('/scenario', 'flip=3&date=2026-07-29')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      return_reason: 'flip',
      scenario_id: 3,
      completed_date: '2026-07-29',
    });
  });

  it('날짜 형식이 아니면 completed_date를 남기지 않는다', () => {
    expect(pv('/scenario', 'date=abc')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
    });
  });

  it('알림 딥링크 유입(utm_campaign=daily_reminder)을 return_reason reminder와 문구 슬러그로 해석한다', () => {
    expect(
      pv(
        '/scenario',
        'utm_source=landit&utm_medium=push&utm_campaign=daily_reminder&utm_content=marco_dm',
      ),
    ).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      return_reason: 'reminder',
      notification_copy: 'marco_dm',
    });
    // content가 없으면 문구 슬러그 없이 유입만 남긴다
    expect(pv('/scenario', 'utm_campaign=daily_reminder')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      return_reason: 'reminder',
    });
    expect(pv('/scenario', 'utm_campaign=other_campaign')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
    });
  });

  it('복귀 쿼리 값이 비어 있으면 scenario_id 없이 return_reason만 남긴다', () => {
    expect(pv('/scenario', 'flip=')).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      return_reason: 'flip',
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

  it('편지 상세는 받은·보낸이 다른 화면이고, 번호는 속성으로 뺀다', () => {
    // 두 칸이 아이디 공간을 따로 써서 화면 이름도 주소를 따라 갈린다
    expect(pv('/mailbox/received/3')).toEqual({
      page_name: 'mailbox_received',
      path: '/mailbox/received/3',
      letter_id: 3,
    });
    expect(pv('/mailbox/sent/11')).toEqual({
      page_name: 'mailbox_sent',
      path: '/mailbox/sent/11',
      feedback_id: 11,
    });
  });

  it('피드백 작성은 유형이 달라도 화면 이름이 하나다', () => {
    expect(pv('/mailbox/compose/bug')).toEqual({
      page_name: 'feedback_compose',
      path: '/mailbox/compose/bug',
      feedback_type: 'BUG',
    });
  });

  it('유형을 고르기 전 작성 진입은 유형 없이 남긴다', () => {
    expect(pv('/mailbox/compose')).toEqual({
      page_name: 'feedback_compose',
      path: '/mailbox/compose',
    });
  });

  it('편지함 목록은 보고 있는 칸이 달라도 같은 화면이다', () => {
    expect(pv('/mailbox', 'box=sent')).toEqual({
      page_name: 'mailbox',
      path: '/mailbox',
    });
  });

  it('루트는 계측하지 않는다', () => {
    expect(pv('/')).toBeNull();
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
