// 시나리오 복귀 주소 조립 검증 — 앰플리튜드가 읽는 신호와 날짜가 함께 실려야 한다
import { describe, expect, it } from 'vitest';

import {
  readDateParam,
  scenarioExpressionBranchPath,
  scenarioExpressionPath,
  scenarioReturnPath,
  scenarioTalkPath,
  sessionExpressionBranchPath,
  sessionExpressionPath,
  smallTalkPath,
} from './routes';

describe('scenarioReturnPath', () => {
  it('아무것도 안 주면 시나리오 탭 그대로다', () => {
    expect(scenarioReturnPath()).toBe('/scenario');
  });

  it('오늘로 돌아갈 때는 날짜를 붙이지 않는다', () => {
    // Given 오늘 카드에서 나온 복귀에서
    // When 날짜 없이 주소를 만들면
    // Then 날짜 없는 주소가 나온다 — 자정을 넘겨도 어제에 갇히지 않는다
    expect(scenarioReturnPath({ flip: 12 })).toBe('/scenario?flip=12');
  });

  it('지난 날에서 나오면 그 날짜가 실린다', () => {
    expect(scenarioReturnPath({ flip: 12, date: '2026-07-29' })).toBe(
      '/scenario?flip=12&date=2026-07-29',
    );
  });

  it('날짜가 null이면 없는 것으로 본다', () => {
    // 보고 있는 날이 아직 안 정해진 경우 null이 그대로 넘어온다
    expect(scenarioReturnPath({ flip: 12, date: null })).toBe(
      '/scenario?flip=12',
    );
  });
});

describe('scenarioTalkPath', () => {
  it('오늘 카드에서 들어가면 날짜를 달지 않는다', () => {
    expect(scenarioTalkPath(12)).toBe('/conversation/scenario/12');
  });

  it('지난 날 카드에서 들어가면 그 날짜를 달고 간다', () => {
    // Given 지난 날 카드에서 다시 대화하기를 눌렀을 때
    // When 대화 주소를 만들면
    // Then 날짜가 실린다 — 그래야 어느 날 카드인지 대화 화면이 알 수 있다
    expect(scenarioTalkPath(12, '2026-07-29')).toBe(
      '/conversation/scenario/12?date=2026-07-29',
    );
  });
});

describe('scenarioExpressionBranchPath', () => {
  it('둘째 칸에 출처를 세운다 — 시나리오 표현은 시나리오가 주인이다', () => {
    expect(scenarioExpressionBranchPath(12)).toBe(
      '/expressions/scenario/12/branch',
    );
  });

  it('지난 날에서 온 대화면 그 날짜를 이어 나른다', () => {
    expect(scenarioExpressionBranchPath(12, '2026-07-29')).toBe(
      '/expressions/scenario/12/branch?date=2026-07-29',
    );
  });
});

describe('scenarioExpressionPath', () => {
  it('오늘 카드에서 들어가면 날짜를 달지 않는다', () => {
    expect(scenarioExpressionPath(12, 34)).toBe('/expressions/scenario/12/34');
  });

  it('지난 날 카드에서 들어가면 그 날짜를 달고 간다', () => {
    // Given 지난 날 카드를 뒤집어 표현을 골랐을 때
    // When 학습 주소를 만들면
    // Then 날짜가 실린다 — 나올 때 그 날로 돌아가야 한다
    expect(scenarioExpressionPath(12, 34, '2026-07-29')).toBe(
      '/expressions/scenario/12/34?date=2026-07-29',
    );
  });
});

describe('sessionExpressionBranchPath', () => {
  it('스몰톡 표현은 그 대화에서 만들어져 세션이 주인이다', () => {
    // 날짜를 달지 않는다 — 시나리오와 달리 "어느 날 카드"라는 개념이 없다
    expect(sessionExpressionBranchPath(7)).toBe(
      '/expressions/session/7/branch',
    );
  });
});

describe('sessionExpressionPath', () => {
  it('학습을 마치면 한 칸 위인 그 세션의 표현 목록으로 돌아간다', () => {
    expect(sessionExpressionPath(7, 34)).toBe('/expressions/session/7/34');
  });
});

describe('readDateParam', () => {
  it('yyyy-MM-dd면 그대로 읽는다', () => {
    expect(readDateParam(new URLSearchParams('date=2026-07-29'))).toBe(
      '2026-07-29',
    );
  });

  it('날짜가 없으면 오늘로 본다', () => {
    expect(readDateParam(new URLSearchParams(''))).toBeUndefined();
  });

  it('형식이 어긋나면 없는 것으로 본다', () => {
    // Given 손으로 고친 주소가 들어왔을 때
    // When 날짜를 읽으면
    // Then 조회로 흘려보내지 않는다 — 백엔드가 400을 준다
    expect(readDateParam(new URLSearchParams('date=7-29'))).toBeUndefined();
    expect(readDateParam(new URLSearchParams('date=abc'))).toBeUndefined();
    expect(readDateParam(new URLSearchParams('date='))).toBeUndefined();
  });
});

describe('smallTalkPath', () => {
  it('주제를 고르면 상대가 먼저 시작하는 주소가 된다', () => {
    // Given 홈에서 상대를 고르고 주제까지 골랐을 때
    // When 대화 주소를 만들면
    // Then 상대·시작 방식·주제가 함께 실린다 — 새로고침해도 무슨 대화를 열지 알 수 있어야 한다
    expect(
      smallTalkPath({ partner: 'teddy', mode: 'ai_first', topicId: 2 }),
    ).toBe('/conversation/smalltalk?mode=ai_first&partner=teddy&topicId=2');
  });

  it('내가 먼저 걸면 주제 없이 상대와 시작 방식만 싣는다', () => {
    // 자유 발화라 고른 주제가 없다 — 빈 topicId를 붙이면 서버가 없는 주제를 찾는다
    expect(smallTalkPath({ partner: 'marco', mode: 'user_first' })).toBe(
      '/conversation/smalltalk?mode=user_first&partner=marco',
    );
  });
});
