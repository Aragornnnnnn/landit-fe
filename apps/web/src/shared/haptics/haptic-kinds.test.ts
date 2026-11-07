// 진동 이름 6가지가 플랫폼별로 어떤 실제 진동이 되는지, 이름 판별이 맞는지 검증
import { describe, expect, it } from 'vitest';

import { HAPTIC_KINDS, isHapticKind, patternOf } from './haptic-kinds';

describe('isHapticKind', () => {
  it('정해 둔 여섯 이름만 진동 이름으로 본다', () => {
    expect(HAPTIC_KINDS).toEqual([
      'tap',
      'tick',
      'success',
      'celebrate',
      'warning',
      'error',
    ]);
    for (const kind of HAPTIC_KINDS) expect(isHapticKind(kind)).toBe(true);
  });

  it('세기 이름(medium 등)이나 규격 밖 값은 진동 이름이 아니다', () => {
    expect(isHapticKind('medium')).toBe(false);
    expect(isHapticKind('light')).toBe(false);
    expect(isHapticKind('boom')).toBe(false);
    expect(isHapticKind('')).toBe(false);
  });
});

describe('patternOf', () => {
  it('누름은 두 플랫폼 모두 light다', () => {
    expect(patternOf('tap', 'ios')).toBe('light');
    expect(patternOf('tap', 'android')).toBe('light');
  });

  it('한 칸은 iOS selection, Android는 selection이 거의 안 느껴져 light다', () => {
    expect(patternOf('tick', 'ios')).toBe('selection');
    expect(patternOf('tick', 'android')).toBe('light');
  });

  it('축하는 지금 success와 같은 진동이다', () => {
    expect(patternOf('celebrate', 'ios')).toBe(patternOf('success', 'ios'));
    expect(patternOf('celebrate', 'android')).toBe(
      patternOf('success', 'android'),
    );
  });

  it('결과 이름은 같은 이름의 알림 진동이다', () => {
    expect(patternOf('success', 'ios')).toBe('success');
    expect(patternOf('warning', 'ios')).toBe('warning');
    expect(patternOf('error', 'android')).toBe('error');
  });
});
