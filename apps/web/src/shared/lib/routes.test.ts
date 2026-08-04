// 시나리오 복귀 주소 조립 검증 — 앰플리튜드가 읽는 신호와 날짜가 함께 실려야 한다
import { describe, expect, it } from 'vitest';

import {
  conversationPath,
  expressionBranchPath,
  expressionPath,
  readDateParam,
  scenarioReturnPath,
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

describe('conversationPath', () => {
  it('오늘 카드에서 들어가면 날짜를 달지 않는다', () => {
    expect(conversationPath(12)).toBe('/conversation/12');
  });

  it('지난 날 카드에서 들어가면 그 날짜를 달고 간다', () => {
    // Given 지난 날 카드에서 다시 대화하기를 눌렀을 때
    // When 대화 주소를 만들면
    // Then 날짜가 실린다 — 그래야 어느 날 카드인지 대화 화면이 알 수 있다
    expect(conversationPath(12, '2026-07-29')).toBe(
      '/conversation/12?date=2026-07-29',
    );
  });
});

describe('expressionBranchPath', () => {
  it('오늘 대화 직후면 날짜를 달지 않는다', () => {
    expect(expressionBranchPath(12)).toBe('/expressions/12/branch');
  });

  it('지난 날에서 온 대화면 그 날짜를 이어 나른다', () => {
    expect(expressionBranchPath(12, '2026-07-29')).toBe(
      '/expressions/12/branch?date=2026-07-29',
    );
  });
});

describe('expressionPath', () => {
  it('오늘 카드에서 들어가면 날짜를 달지 않는다', () => {
    expect(expressionPath(12, 34)).toBe('/expressions/12/34');
  });

  it('지난 날 카드에서 들어가면 그 날짜를 달고 간다', () => {
    // Given 지난 날 카드를 뒤집어 표현을 골랐을 때
    // When 학습 주소를 만들면
    // Then 날짜가 실린다 — 나올 때 그 날로 돌아가야 한다
    expect(expressionPath(12, 34, '2026-07-29')).toBe(
      '/expressions/12/34?date=2026-07-29',
    );
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
