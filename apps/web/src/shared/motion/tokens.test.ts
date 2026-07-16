// 방향성 슬라이드 variants의 방향·접근성 분기 계약 테스트
import { describe, expect, it } from 'vitest';

import { slideVariants } from './tokens';

// variants의 enter/exit는 direction을 받는 함수다 — 테스트에서 직접 호출해 값을 확인한다
type DirectionalVariant = (direction: number) => { opacity: number; x: number };

describe('slideVariants', () => {
  it('전진 방향(1)이면 오른쪽에서 들어와 왼쪽으로 나간다', () => {
    // given — 이동을 허용하는 일반 모드
    const variants = slideVariants(false);

    // when — 전진 방향으로 enter·exit 좌표를 구하면
    const enter = (variants.enter as DirectionalVariant)(1);
    const exit = (variants.exit as DirectionalVariant)(1);

    // then — 들어올 땐 +x(오른쪽), 나갈 땐 -x(왼쪽)
    expect(enter.x).toBeGreaterThan(0);
    expect(exit.x).toBeLessThan(0);
  });

  it('후진 방향(-1)이면 전진과 반대로 미끄러진다', () => {
    // given — 이동을 허용하는 일반 모드
    const variants = slideVariants(false);

    // when — 후진 방향으로 enter 좌표를 구하면
    const enter = (variants.enter as DirectionalVariant)(-1);

    // then — 왼쪽(-x)에서 들어온다
    expect(enter.x).toBeLessThan(0);
  });

  it('reduced motion이면 이동 없이 페이드만 남긴다', () => {
    // given — 접근성 설정으로 이동을 끈 모드
    const variants = slideVariants(true);

    // when — 방향과 무관하게 enter·exit 좌표를 구하면
    const enter = (variants.enter as DirectionalVariant)(1);
    const exit = (variants.exit as DirectionalVariant)(-1);

    // then — x는 0이고 opacity 전환만 유지된다
    expect(enter.x).toBe(0);
    expect(exit.x).toBe(0);
    expect(enter.opacity).toBe(0);
  });
});
