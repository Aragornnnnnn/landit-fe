// 시나리오 복귀 주소 조립 검증 — 앰플리튜드가 읽는 신호와 날짜가 함께 실려야 한다
import { describe, expect, it } from 'vitest';

import { scenarioReturnPath } from './routes';

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
