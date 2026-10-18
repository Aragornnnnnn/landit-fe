// burstConfetti — 기본은 브랜드 폭죽 세 발, 옵션으로 화면마다 색·높이·세기를 바꾼다
import confetti from 'canvas-confetti';
import { describe, expect, it, vi } from 'vitest';

import { burstConfetti } from './confetti';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const shots = () => vi.mocked(confetti).mock.calls.map(([options]) => options);

describe('burstConfetti', () => {
  it('옵션이 없으면 브랜드 색으로 양쪽 두 발과 가운데 한 발을 쏜다', () => {
    burstConfetti();

    expect(shots()).toHaveLength(3);
    expect(shots()[0]?.colors).toEqual([
      '#e07a3a',
      '#2f7d54',
      '#fbbf24',
      '#ffffff',
    ]);
  });

  it('가운데를 끄면 양쪽 두 발만 쏜다', () => {
    burstConfetti({ withCenter: false });

    expect(shots()).toHaveLength(2);
  });

  it('색·높이·세기를 바꾸면 양쪽 발사에 그대로 들어간다', () => {
    burstConfetti({
      withCenter: false,
      colors: ['#000000'],
      originY: 0.35,
      particleCount: 50,
      spread: 75,
    });

    expect(shots()[1]).toMatchObject({
      colors: ['#000000'],
      origin: { x: 1, y: 0.35 },
      particleCount: 50,
      spread: 75,
      angle: 120,
    });
  });
});
