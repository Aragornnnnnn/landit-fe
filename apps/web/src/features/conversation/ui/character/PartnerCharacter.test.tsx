// PartnerCharacter — 립싱크 입력과, 움직임이 SVG 안이 아니라 층 상자에 걸리는지를 검증한다
// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';

import type { PlayingSpeech } from '../../model/useAiSpeech';
import { PartnerCharacter } from './PartnerCharacter';

const lipsync = vi.hoisted(() => ({
  loadLoudnessTrack: vi.fn(),
  advanceMouth: vi.fn(),
}));
vi.mock('../../model/lipsync', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../model/lipsync')>();
  lipsync.advanceMouth.mockImplementation(original.advanceMouth);
  return {
    ...original,
    loadLoudnessTrack: lipsync.loadLoudnessTrack,
    advanceMouth: lipsync.advanceMouth,
  };
});

const speech: PlayingSpeech = {
  text: 'Oh nice, tell me more.',
  playback: { progress: () => 0.5, source: 'blob:voice' },
};

// 입이 지금 쓰는 글자 진행 표 — advanceMouth의 다섯 번째 인자다
const lastArticulation = () =>
  lipsync.advanceMouth.mock.lastCall?.[4] as Float32Array | null;

const renderSpeaking = () =>
  render(
    <PartnerCharacter
      partner="chloe"
      look={{ posture: 'speaking', expression: 'neutral' }}
      speech={speech}
    />,
  );

// 입은 매 프레임 움직인다 — 다음 프레임을 직접 돌려 마지막 입력을 본다
const nextFrame = () => act(() => vi.advanceTimersToNextFrame());

// jsdom은 <g>를 일반 SVGElement로 만들고 getBBox가 없다 — 영역을 재는 테스트는 여기에 심는다
const svgPrototype = SVGElement.prototype as SVGElement &
  Pick<SVGGraphicsElement, 'getBBox'>;

// jsdom에 없는 메서드를 이 테스트 동안만 심는다 — 원래 없던 것은 되돌릴 때 지워야 뒤 테스트가 있다고 착각하지 않는다
const plant = <T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K],
) => {
  const had = Object.prototype.hasOwnProperty.call(target, key);
  const original = target[key];
  target[key] = value;
  onTestFinished(() => {
    if (had) target[key] = original;
    else delete target[key];
  });
};

describe('PartnerCharacter 립싱크', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    lipsync.advanceMouth.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('음량 표를 읽는 동안에는 입을 닫아 둔다 — 음성 앞머리는 무음이다', () => {
    // Given
    lipsync.loadLoudnessTrack.mockReturnValue(new Promise(() => {}));

    // When
    renderSpeaking();
    nextFrame();

    // Then
    expect(Number.isNaN(lastArticulation()?.[0])).toBe(true);
  });

  it('음량 표가 늦어지면 입을 다시 움직인다 — 소리가 나는데 입이 닫혀 있으면 안 된다', async () => {
    // Given
    lipsync.loadLoudnessTrack.mockReturnValue(new Promise(() => {}));
    renderSpeaking();

    // When
    await act(() => vi.advanceTimersByTimeAsync(600));
    nextFrame();

    // Then
    expect(lastArticulation()).toBeNull();
  });

  it('음량 표 읽기에 실패하면 글자를 고르게 나눠 입을 움직인다', async () => {
    // Given
    lipsync.loadLoudnessTrack.mockResolvedValue(null);

    // When
    renderSpeaking();
    await act(() => vi.advanceTimersByTimeAsync(0));
    nextFrame();

    // Then
    expect(lastArticulation()).toBeNull();
  });

  it('음량 표를 읽으면 소리에 맞춘 글자 진행 표로 입을 움직인다', async () => {
    // Given
    lipsync.loadLoudnessTrack.mockResolvedValue(
      Float32Array.from(Array<number>(100).fill(0.2)),
    );

    // When
    renderSpeaking();
    await act(() => vi.advanceTimersByTimeAsync(0));
    nextFrame();

    // Then
    expect(lastArticulation()).toHaveLength(100);
  });
});

describe('PartnerCharacter 층', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    lipsync.loadLoudnessTrack.mockResolvedValue(null);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('입 움직임은 입 층 상자에 걸리고 SVG 안의 입은 그대로 둔다 — 합성 레이어라야 매 프레임 다시 그리지 않는다', async () => {
    // Given
    const { container } = renderSpeaking();

    // When
    await act(() => vi.advanceTimersByTimeAsync(0));
    nextFrame();

    // Then
    const mouthLayer = container.querySelector<HTMLElement>(
      '[data-layer="mouth"]',
    );
    expect(mouthLayer?.style.transform).toMatch(
      /^translateY\(-?[\d.]+%\) scale\(/,
    );
    expect(
      container.querySelector<SVGGElement>('#mouth')?.style.transform,
    ).toBe('');
  });

  it('발화가 끝나면 입 층의 인라인 변형을 지워 자세 CSS에 돌려준다', async () => {
    // Given
    const { container, rerender } = renderSpeaking();
    await act(() => vi.advanceTimersByTimeAsync(0));
    nextFrame();

    // When
    rerender(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );

    // Then
    const mouthLayer = container.querySelector<HTMLElement>(
      '[data-layer="mouth"]',
    );
    expect(mouthLayer?.style.transform).toBe('');
    expect(mouthLayer?.style.transition).toBe('');
  });

  it('상대가 바뀌면 그 상대의 층으로 다시 그린다', () => {
    // Given
    const { container, rerender } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );
    expect(container.querySelector('[data-layer="arm-left"]')).toBeNull();

    // When
    rerender(
      <PartnerCharacter
        partner="marco"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );

    // Then
    expect(container.querySelector('[data-layer="arm-left"]')).not.toBeNull();
    expect(
      container.querySelectorAll('[data-layer="mouth"] #mouth'),
    ).toHaveLength(1);
  });

  it('끄덕임은 머리 상자를 viewBox 높이 대비 %로 움직인다 — 상자는 CSS 픽셀이라 SVG 단위를 그대로 쓰면 크기마다 깊이가 달라진다', () => {
    // Given
    const animate = vi.fn(
      () => ({ cancel: vi.fn(), onfinish: null }) as unknown as Animation,
    );
    plant(Element.prototype, 'animate', animate);
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'listening', expression: 'neutral' }}
        speech={null}
      />,
    );

    // When
    act(() => vi.advanceTimersByTime(3600));

    // Then
    const headPose = container.querySelector('[data-layer="head-pose"]');
    const nods = animate.mock.contexts
      .map((target, index) => [target, animate.mock.calls[index]] as const)
      .filter(([target]) => target === headPose);
    expect(nods.length).toBeGreaterThan(0);
    expect(JSON.stringify(nods[0][1])).toMatch(/translateY\(-?[\d.]+%\)/);
    expect(JSON.stringify(nods[0][1])).not.toMatch(/px/);
  });

  it('입 상자의 변형 기준점은 원래 입 그룹 영역의 같은 비율 자리를 상자 기준 %로 옮긴 것이다', () => {
    // Given — 입 그룹이 viewBox(100 200 400 800) 안 (300,500)에서 40×20을 차지한다
    plant(svgPrototype, 'getBBox', function (this: SVGElement) {
      return this.id === 'mouth'
        ? ({ x: 300, y: 500, width: 40, height: 20 } as DOMRect)
        : ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect);
    });

    // When
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
        viewBox="100 200 400 800"
      />,
    );

    // Then — 가로 50%·세로 15% 자리: x (320-100)/400, y (503-200)/800
    const mouthLayer = container.querySelector<HTMLElement>(
      '[data-layer="mouth"]',
    );
    expect(mouthLayer?.style.transformOrigin).toBe('55.000% 37.875%');
  });
});
