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

  it('오늘의 시나리오 리마인드 알림 유입을 캠페인으로 남긴다', () => {
    // BE가 다는 값 그대로 — utm_source=push&utm_medium=notification&utm_campaign=…
    expect(
      pv(
        '/scenario',
        'utm_source=push&utm_medium=notification&utm_campaign=daily_scenario_reminder',
      ),
    ).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      entry_campaign: 'daily_scenario_reminder',
    });
  });

  it('구 로컬 알림 주소(utm_medium=push, daily_reminder, 문구 슬러그)도 알림 유입으로 읽는다', () => {
    expect(
      pv(
        '/scenario',
        'utm_source=landit&utm_medium=push&utm_campaign=daily_reminder&utm_content=marco_dm',
      ),
    ).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      entry_campaign: 'daily_reminder',
      entry_content: 'marco_dm',
    });
  });

  it('시나리오 밖 경로로 온 알림 유입도 같은 자리에 캠페인을 남긴다', () => {
    expect(
      pv(
        '/expressions/scenario/10/100',
        'utm_source=push&utm_medium=notification&utm_campaign=continue_expression',
      ),
    ).toEqual({
      page_name: 'expression_learning',
      path: '/expressions/scenario/10/100',
      scenario_id: 10,
      expression_id: 100,
      entry_campaign: 'continue_expression',
    });
    expect(
      pv(
        '/smalltalk',
        'utm_source=push&utm_medium=notification&utm_campaign=small_talk_reminder',
      ),
    ).toEqual({
      page_name: 'smalltalk',
      path: '/smalltalk',
      entry_campaign: 'small_talk_reminder',
    });
    expect(
      pv(
        '/mailbox/received/3',
        'utm_source=push&utm_medium=notification&utm_campaign=mailbox_reply',
      ),
    ).toEqual({
      page_name: 'mailbox_received',
      path: '/mailbox/received/3',
      letter_id: 3,
      entry_campaign: 'mailbox_reply',
    });
  });

  it('홈 화면 위젯 탭 유입(utm_medium=widget)도 캠페인으로 남긴다', () => {
    expect(
      pv(
        '/scenario',
        'utm_source=widget&utm_medium=widget&utm_campaign=streak_widget',
      ),
    ).toEqual({
      page_name: 'scenario',
      path: '/scenario',
      entry_campaign: 'streak_widget',
    });
  });

  it('알림·위젯이 아닌 유입(소셜)이나 캠페인만 있는 주소는 유입 속성을 남기지 않는다', () => {
    expect(
      pv('/scenario', 'utm_medium=social&utm_campaign=launch_event'),
    ).toEqual({
      page_name: 'scenario',
      path: '/scenario',
    });
    expect(pv('/scenario', 'utm_campaign=daily_scenario_reminder')).toEqual({
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

  it('시나리오 대화 동적 세그먼트를 page_name conversation_scenario + scenario_id로 정규화한다', () => {
    expect(pv('/conversation/scenario/12')).toEqual({
      page_name: 'conversation_scenario',
      path: '/conversation/scenario/12',
      scenario_id: 12,
    });
  });

  it('스몰톡 대화는 id 없이 page_name conversation_smalltalk으로 남는다', () => {
    // 주소의 상대·시작 방식(mode/partner)은 여기 싣지 않는다 — Conversation Started가 이미 남긴다
    expect(
      pv('/conversation/smalltalk', 'mode=user_first&partner=chloe'),
    ).toEqual({
      page_name: 'conversation_smalltalk',
      path: '/conversation/smalltalk',
    });
  });

  it('표현 분기·학습 경로를 각각 정규화한다', () => {
    // 둘째 칸이 출처라 시나리오 id는 셋째 칸에서 읽는다
    expect(pv('/expressions/scenario/3/branch')).toEqual({
      page_name: 'expression_list',
      path: '/expressions/scenario/3/branch',
      scenario_id: 3,
    });
    expect(pv('/expressions/scenario/3/45')).toEqual({
      page_name: 'expression_learning',
      path: '/expressions/scenario/3/45',
      scenario_id: 3,
      expression_id: 45,
    });
  });

  it('스몰톡 표현은 같은 화면 이름에 세션 id를 싣는다', () => {
    // 화면은 시나리오와 같은 것이다 — 어디서 온 표현인지만 id로 갈린다
    expect(pv('/expressions/session/7/branch')).toEqual({
      page_name: 'expression_list',
      path: '/expressions/session/7/branch',
      session_id: 7,
    });
    expect(pv('/expressions/session/7/45')).toEqual({
      page_name: 'expression_learning',
      path: '/expressions/session/7/45',
      session_id: 7,
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
    const slugs = {
      bug: 'BUG_REPORT',
      feature: 'FEATURE_REQUEST',
      question: 'QUESTION',
      cheer: 'CHEER',
    };

    for (const [slug, feedbackType] of Object.entries(slugs)) {
      expect(pv(`/mailbox/compose/${slug}`)).toEqual({
        page_name: 'feedback_compose',
        path: `/mailbox/compose/${slug}`,
        feedback_type: feedbackType,
      });
    }
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
