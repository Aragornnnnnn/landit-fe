// 표정 플레이어 — 바깥 조정(덮어쓰기·더하기·폭 줄이기·상한)과 모션 줄이기 설정에서 계속 도는 층이 멈추는지 검증한다
// @vitest-environment jsdom
import { describe, expect, it, onTestFinished, vi } from 'vitest';

import { ExpressionPlayer, type ExpressionData } from './expression-player';

// 머리 하나가 표정에 따라 움직이고, 숨쉬기 층이 머리를 위아래로 흔드는 가장 작은 데이터
const fakeData = (): ExpressionData => ({
  viewBox: '0 0 100 100',
  names: { head: '0:1' },
  svg: '<svg viewBox="0 0 100 100"><g id="h"></g></svg>',
  targets: {
    '0:1': {
      el: 'h',
      kind: 'xf',
      base: { x: 0, y: 10, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 },
    },
  },
  morph: {},
  clips: [],
  anims: {
    still: { dur: 1, fps: 60, loop: false, tracks: [] },
    breathe: {
      dur: 60,
      fps: 60,
      loop: true,
      tracks: [
        {
          t: '0:1',
          p: 'x',
          k: [
            [0, 0, 'linear', null],
            [60, 60, 'hold', null],
          ],
        },
      ],
    },
  },
  layers: [{ name: 'Breathe', default: 'breathe', rules: {} }],
});

const headTransform = (host: HTMLElement) =>
  host.querySelector('g')?.getAttribute('transform') ?? '';

describe('ExpressionPlayer', () => {
  it('set 조정은 애니메이션 값을 덮어쓰고 add 조정은 그 위에 더한다', () => {
    // Given
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData());
    player.adjust('head', 'y', { set: 40, add: 2 });

    // When
    player.step(0);

    // Then
    expect(headTransform(host)).toContain('translate(0.000 42.000)');
  });

  it('scale 조정은 애니메이션이 기본값에서 벗어난 폭만 줄인다', () => {
    // Given 숨쉬기가 머리를 x 0→60으로 옮기는 중에 폭을 절반으로 줄이면
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData());
    player.adjust('head', 'x', { scale: 0.5 });

    // When 절반(30)까지 진행하면
    player.step(0.5);

    // Then 기본값(0)에서 15만큼만 움직인다
    expect(headTransform(host)).toContain('translate(15.000 10.000)');
  });

  it('max 조정은 값이 상한을 넘지 않게 한다', () => {
    // Given 머리 x에 상한 20을 걸면
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData());
    player.adjust('head', 'x', { max: 20 });

    // When 애니메이션이 30까지 가도
    player.step(0.5);

    // Then 20에서 멈춘다
    expect(headTransform(host)).toContain('translate(20.000 10.000)');
  });

  it('이름으로 파츠 요소를 꺼내고, 이름표에 없으면 null이다', () => {
    // Given
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData());

    // When / Then
    expect(player.part('head')).toBe(host.querySelector('g'));
    expect(player.part('tail')).toBeNull();
  });

  it('모션 줄이기 설정이면 숨쉬기 층은 시간이 흘러도 움직이지 않는다', () => {
    // Given
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData(), { ambient: false });

    // When
    player.step(0.5);

    // Then
    expect(headTransform(host)).toContain('translate(0.000 10.000)');
  });

  it('한 문서에 플레이어가 둘이면 각자 자기 클립을 가리킨다', () => {
    // Given
    const data = {
      ...fakeData(),
      svg: '<svg viewBox="0 0 100 100"><defs><clipPath id="c"><rect/></clipPath></defs><g id="h" clip-path="url(#c)"></g></svg>',
    };
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);

    // When
    new ExpressionPlayer(first, data).step(0);
    new ExpressionPlayer(second, data).step(0);

    // Then
    const clipOf = (host: HTMLElement) =>
      host.querySelector('g')?.getAttribute('clip-path');
    const clipIdOf = (host: HTMLElement) =>
      `url(#${host.querySelector('clipPath')?.id})`;
    expect(clipOf(first)).toBe(clipIdOf(first));
    expect(clipOf(second)).toBe(clipIdOf(second));
    expect(clipOf(first)).not.toBe(clipOf(second));
    expect(headTransform(second)).toContain('translate(0.000 10.000)');
  });

  it('움직인 파츠가 없는 프레임에는 클립을 다시 맞추지 않는다 — 클립 계산(getCTM)이 매 프레임 돌면 가만히 있어도 비싸다', () => {
    // Given 머리를 따라가는 클립 조각 하나 — jsdom엔 getCTM이 없어 이 테스트 동안만 심는다
    const matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const fakeCTM = vi.fn(() => ({
      ...matrix,
      inverse: () => ({ ...matrix, multiply: () => matrix }),
    }));
    const proto = SVGElement.prototype as unknown as { getCTM?: unknown };
    proto.getCTM = fakeCTM;
    onTestFinished(() => {
      delete proto.getCTM;
    });
    const data = {
      ...fakeData(),
      svg: '<svg viewBox="0 0 100 100"><defs><clipPath id="c"><rect id="piece"/></clipPath></defs><g id="h"></g></svg>',
      clips: [{ ref: 'h', pieces: [{ el: 'piece', src: 'h' }] }],
    };
    const player = new ExpressionPlayer(document.createElement('div'), data, {
      ambient: false,
    });
    player.step(0);
    fakeCTM.mockClear();

    // When 아무것도 움직이지 않는 프레임을 지나면
    player.step(0.1);

    // Then 클립을 다시 재지 않는다
    expect(fakeCTM).not.toHaveBeenCalled();

    // When 머리가 움직이면
    player.adjust('head', 'x', { set: 5 });
    player.step(0.1);

    // Then 그때 다시 맞춘다
    expect(fakeCTM).toHaveBeenCalled();
  });

  it('이름표에 없는 파츠를 조정하면 아무것도 바꾸지 않는다', () => {
    // Given
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData(), { ambient: false });
    player.adjust('tail', 'y', { set: 99 });

    // When
    player.step(0);

    // Then
    expect(headTransform(host)).toContain('translate(0.000 10.000)');
  });
  it('조정을 걷으면 애니메이션이 없는 값은 기본값으로 돌아간다', () => {
    // Given
    const host = document.createElement('div');
    const player = new ExpressionPlayer(host, fakeData(), { ambient: false });
    player.adjust('head', 'y', { set: 40 });
    player.step(0);

    // When
    player.adjust('head', 'y', null);
    player.step(0);

    // Then
    expect(headTransform(host)).toContain('translate(0.000 10.000)');
  });
});
