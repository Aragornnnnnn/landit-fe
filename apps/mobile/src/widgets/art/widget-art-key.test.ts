// 아트 키·안드로이드 위젯 매핑 검증 — 파일명 규칙과 등록 이름이 어긋나면 위젯이 빈 그림을 그린다
import { familyForWidget } from '../android/families';
import { artKeyOf } from './widget-art-key';

describe('artKeyOf', () => {
  it('일반 상태는 상태-사이즈로 키를 만든다', () => {
    expect(
      artKeyOf({ kind: 'melted', displayStreak: 5, milestone: null }, 'large'),
    ).toBe('melted-large');
  });

  it('마일스톤은 달성 숫자가 키에 들어간다', () => {
    expect(
      artKeyOf(
        { kind: 'milestone', displayStreak: 14, milestone: 14 },
        'small',
      ),
    ).toBe('milestone-14-small');
  });
});

describe('familyForWidget', () => {
  it('등록된 위젯 이름을 사이즈로 매핑한다', () => {
    expect(familyForWidget('StreakSmall')).toBe('small');
    expect(familyForWidget('StreakMedium')).toBe('medium');
    expect(familyForWidget('StreakLarge')).toBe('large');
  });

  it('모르는 이름은 small로 폴백한다', () => {
    expect(familyForWidget('Unknown')).toBe('small');
  });
});
