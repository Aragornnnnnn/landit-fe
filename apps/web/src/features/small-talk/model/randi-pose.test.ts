// 래디 포즈 그림 고르기 — 서버가 새 포즈 이름을 보내도 그림이 비지 않는다
import { describe, expect, it } from 'vitest';

import { toPoseImage } from './randi-pose';

describe('toPoseImage', () => {
  it('아는 포즈면 그 그림이다', () => {
    expect(toPoseImage('WAVE_SMILE')).toContain('landy-wave-smile');
  });

  it('모르는 포즈면 기본 포즈(POINT) 그림으로 폴백한다', () => {
    expect(toPoseImage('DANCE')).toContain('landy-point');
  });
});
