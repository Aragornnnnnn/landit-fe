// 스몰톡 소진 판정 — 서버 canStart를 따르되, 정책이 켜진 뒤 학습 문이 열린 사람은 소진으로 보지 않는지 검증
import { describe, expect, it } from 'vitest';

import { isTalkExhausted } from './talk-exhausted';

const base = { canStart: true, trialOn: true, open: false };

describe('isTalkExhausted', () => {
  it('서버가 시작할 수 없다고 하면 소진이다', () => {
    // Given 무료 5분을 다 쓴 무료 사용자 / When 판정하면 / Then 소진이다
    expect(isTalkExhausted({ ...base, canStart: false })).toBe(true);
  });

  it('정책이 켜진 뒤 학습 문이 열렸으면 받아 둔 응답이 소진이어도 소진으로 보지 않는다 — 결제하고 막 돌아온 사람이 갇히지 않게', () => {
    // Given 다 쓴 화면에서 결제하고 돌아왔는데 응답은 결제 전 것이다
    // When 판정하면 / Then 시작 버튼을 돌려준다
    expect(isTalkExhausted({ ...base, canStart: false, open: true })).toBe(
      false,
    );
  });

  it('정책이 켜지기 전엔 서버 판정을 그대로 따른다 — 예전 하루 한도', () => {
    // Given 정책 적용 시각 전, 하루 한도를 다 쓴 사용자
    // When 판정하면 / Then 소진이다
    expect(
      isTalkExhausted({ canStart: false, trialOn: false, open: true }),
    ).toBe(true);
  });
});
