// 소환 게이트 검증 — 등장 애니메이션은 그날 처음이거나 알림으로 들어왔을 때만 나온다
import { afterEach, describe, expect, it } from 'vitest';

import { decideSummon, markSummoned, readLastSummoned } from './lamp-gate';

afterEach(() => localStorage.clear());

describe('decideSummon', () => {
  it('오늘 램프 등장 애니메이션을 아직 안 봤으면 소환한다', () => {
    // Given 오늘 램프 등장을 한 번도 본 적 없는 사람이
    const signals = {
      lastSeen: null,
      today: '2026-08-05',
      fromReminder: false,
    };

    // When 시나리오 탭에 들어오면
    const summon = decideSummon(signals);

    // Then 램프가 등장한다
    expect(summon).toBe(true);
  });

  it('오늘 이미 램프 등장을 봤으면 소환하지 않는다', () => {
    // Given 오늘 이미 등장 애니메이션을 본 사람이
    const signals = {
      lastSeen: '2026-08-05',
      today: '2026-08-05',
      fromReminder: false,
    };

    // When 다시 들어오면
    const summon = decideSummon(signals);

    // Then 램프는 카드에 담겨 있다
    expect(summon).toBe(false);
  });

  it('어제 램프 등장을 본 기록은 오늘을 막지 못한다', () => {
    // Given 어제 등장 애니메이션을 본 사람이
    const signals = {
      lastSeen: '2026-08-04',
      today: '2026-08-05',
      fromReminder: false,
    };

    // When 자정을 넘겨 새 카드를 받으면
    const summon = decideSummon(signals);

    // Then 다시 소환한다
    expect(summon).toBe(true);
  });

  it('알림으로 들어오면 오늘 램프 등장을 봤어도 다시 소환한다', () => {
    // Given 오늘 이미 등장 애니메이션을 본 사람이
    const signals = {
      lastSeen: '2026-08-05',
      today: '2026-08-05',
      fromReminder: true,
    };

    // When 리마인더 알림을 눌러 들어오면
    const summon = decideSummon(signals);

    // Then 그래도 소환한다
    expect(summon).toBe(true);
  });
});

// 얇은 저장 래퍼지만 같은 키를 쓴다는 약속은 지켜본다 — 둘의 키가 갈라지면
// 기록해도 못 읽어 매 진입마다 소환되는데, 화면만 봐서는 원인이 안 보인다
describe('markSummoned / readLastSummoned', () => {
  it('기록한 날짜를 그대로 돌려준다', () => {
    markSummoned('2026-08-05');

    expect(readLastSummoned()).toBe('2026-08-05');
  });

  it('기록이 없으면 null이다', () => {
    expect(readLastSummoned()).toBe(null);
  });
});
