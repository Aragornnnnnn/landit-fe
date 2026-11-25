// PartnerCharacter — 립싱크 입력, 움직임이 SVG 안이 아니라 층 상자에 걸리는지, 표정 데이터를 받으면 얼굴을 표정 머리로 바꾸는지 검증한다
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

import { reportWarning } from '@/shared/monitoring/report';

import type { PlayingSpeech } from '../../model/useAiSpeech';
import type { ExpressionData } from './expression-player';
import chloeExpressions from './expressions/chloe.json';
import { PartnerCharacter } from './PartnerCharacter';
import { LAYER_AREAS } from './parts-by-partner';

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

// 표정 데이터는 기본으로 오지 않는 것으로 둔다 — 원래 머리 층(입 층 상자)의 동작을 본다. 표정 머리 테스트만 데이터를 준다
const expressionHead = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('./expression-head', async (importOriginal) => {
  const original = await importOriginal<typeof import('./expression-head')>();
  return { ...original, loadExpressionData: expressionHead.load };
});
vi.mock('@/shared/monitoring/report', () => ({ reportWarning: vi.fn() }));
beforeEach(() => {
  expressionHead.load.mockReturnValue(new Promise(() => {}));
});

// 원본 그림 전체 — 상자를 자르지 않고 입 상자가 제 그림 영역 그대로 잡힌다
const WHOLE = '0 0 1024 1536';
const mouthArea = LAYER_AREAS.chloe.mouth!;
const mouthGroup = {
  x: mouthArea.x + 10,
  y: mouthArea.y + 20,
  width: 40,
  height: 20,
};
// 입 그룹의 (가로 50%, 세로 15%) 자리를 입 상자 영역 기준 %로
const expectedMouthPivot = `${(((mouthGroup.x + 20 - mouthArea.x) / mouthArea.width) * 100).toFixed(3)}% ${(((mouthGroup.y + 3 - mouthArea.y) / mouthArea.height) * 100).toFixed(3)}%`;

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

  it('끄덕임은 머리 상자를 그 상자 높이 대비 %로 움직인다 — 상자는 CSS 픽셀이라 SVG 단위를 그대로 쓰면 크기마다 깊이가 달라진다', () => {
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

  it('입 상자의 변형 기준점은 원래 입 그룹 영역의 같은 비율 자리를 입 상자(제 그림 영역) 기준 %로 옮긴 것이다', () => {
    // Given — 입 그룹이 입 상자 안 (+10,+20)에서 40×20을 차지한다
    plant(svgPrototype, 'getBBox', function (this: SVGElement) {
      return this.id === 'mouth'
        ? ({ ...mouthGroup } as DOMRect)
        : ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect);
    });

    // When
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
        viewBox={WHOLE}
      />,
    );

    // Then — 입 그룹의 가로 50%·세로 15% 자리
    const mouthLayer = container.querySelector<HTMLElement>(
      '[data-layer="mouth"]',
    );
    expect(mouthLayer?.style.transformOrigin).toBe(expectedMouthPivot);
  });

  it('입이 숨은 채 처음 그려져도 표정이 풀리면 입 기준점을 잡는다 — 찡그린 동안엔 입이 숨어 잴 수 없다', () => {
    // Given — 찡그린 채 처음 그려진다. 숨은 입은 영역이 0이라 기준점을 잴 수 없다
    let mouthHidden = true;
    plant(svgPrototype, 'getBBox', function (this: SVGElement) {
      return this.id === 'mouth' && !mouthHidden
        ? ({ ...mouthGroup } as DOMRect)
        : ({ x: 0, y: 0, width: 0, height: 0 } as DOMRect);
    });
    const { container, rerender } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'frown' }}
        speech={null}
        viewBox={WHOLE}
      />,
    );
    const mouthLayer = container.querySelector<HTMLElement>(
      '[data-layer="mouth"]',
    );

    // When
    mouthHidden = false;
    rerender(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
        viewBox={WHOLE}
      />,
    );

    // Then
    expect(mouthLayer?.style.transformOrigin).toBe(expectedMouthPivot);
  });

  it('그릴 영역이 몸 중간에서 잘리면 몸통 상자도 그 안쪽까지만 잡는다 — 보이지 않는 다리까지 레이어를 잡지 않게', () => {
    // Given — 상반신만 그리는 소비처(초상화·퀴즈)처럼 허리 위에서 자른다
    const { container } = render(
      <PartnerCharacter
        partner="marco"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
        viewBox="292 40 440 610"
      />,
    );

    // When
    const torso = container.querySelector<HTMLElement>('[data-layer="torso"]');
    const mouth = container.querySelector<HTMLElement>('[data-layer="mouth"]');

    // Then — 몸통은 프레임 아래 끝을 넘지 않고, 입은 머리 상자 안에 놓인다
    const percent = (value?: string) => Number.parseFloat(value ?? 'NaN');
    expect(
      percent(torso?.style.top) + percent(torso?.style.height),
    ).toBeCloseTo(100, 2);
    expect(percent(mouth?.style.left)).toBeGreaterThanOrEqual(0);
    expect(
      percent(mouth?.style.top) + percent(mouth?.style.height),
    ).toBeLessThanOrEqual(100);
  });
});

describe('PartnerCharacter 표정 머리', () => {
  const chloeData = chloeExpressions as unknown as ExpressionData;
  // 표정 데이터의 파츠 이름 → 플레이어가 그린 요소 (id 앞머리는 플레이어마다 다르다)
  const partOf = (container: HTMLElement, name: string) =>
    container.querySelector(
      `[id$="-${chloeData.targets[chloeData.names[name]].el}"]`,
    );

  beforeEach(() => {
    vi.useFakeTimers();
    lipsync.loadLoudnessTrack.mockResolvedValue(null);
    expressionHead.load.mockResolvedValue(chloeData);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const settle = async () => {
    await act(() => vi.advanceTimersByTimeAsync(0));
    nextFrame();
  };

  it('표정 데이터를 받으면 얼굴은 표정 머리가 그리고, 원래 머리 그림은 고개 기준점을 재는 데만 남긴다', async () => {
    // Given
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );

    // When
    await settle();

    // Then
    expect(partOf(container, 'head')).not.toBeNull();
    expect(container.querySelector('[data-measure]')).not.toBeNull();
    expect(container.querySelector('[data-layer="mouth"]')).toBeNull();
  });

  it('표정 머리는 몸통을 감춘다 — 몸·팔은 전신 층이 따로 그린다', async () => {
    // Given
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );

    // When
    await settle();

    // Then
    expect(
      (partOf(container, 'torso') as SVGElement | null)?.style.display,
    ).toBe('none');
  });

  it('감춘 몸통에는 숨쉬기 값을 쓰지 않는다 — 안 보이는 요소를 매 프레임 고치는 낭비다', async () => {
    // Given
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );
    await settle();
    const before = partOf(container, 'torso')?.getAttribute('transform');

    // When 숨쉬기 한 주기 가까이 지나도
    await act(() => vi.advanceTimersByTimeAsync(2000));

    // Then
    expect(partOf(container, 'torso')?.getAttribute('transform')).toBe(before);
  });

  it('클로이는 표정 머리에 머리카락 틈을 다시 판다 — 표정 데이터에선 틈 조각이 빠져 있다', async () => {
    // Given
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );

    // When
    await settle();

    // Then
    expect(partOf(container, 'head-inner')?.getAttribute('mask')).toMatch(
      /^url\(#hair-gaps-\d+\)$/,
    );
  });

  it('말하는 동안 표정 머리의 벌린 입을 소리에 맞춰 보인다', async () => {
    // Given
    const { container } = renderSpeaking();

    // When
    await settle();
    nextFrame();

    // Then
    expect(partOf(container, 'mouth-open')?.getAttribute('opacity')).toBe(
      '1.000',
    );
    expect(lipsync.advanceMouth).toHaveBeenCalled();
  });

  it('말을 마치고 중립으로 쉬면 벌린 입이 쉬는 입으로 섞여 돌아간다', async () => {
    // Given
    const { container, rerender } = renderSpeaking();
    await settle();

    // When
    rerender(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );
    await act(() => vi.advanceTimersByTimeAsync(600));

    // Then — 쉬는 입은 원래 웃는 입을 세로로 눌러 만든 미소다
    expect(partOf(container, 'mouth-open')?.getAttribute('transform')).toMatch(
      /scale\(0\.8400 0\.4000\)/,
    );
  });

  it('말하는 도중 표정 데이터가 도착해도 원래 입 움직임이 표정 머리에 번지지 않는다 — 첫 발화에 머리 전체가 눌렸다', async () => {
    // Given 표정 데이터가 오기 전에 말이 시작돼 원래 입 층이 움직이는 중
    let arrive!: (data: ExpressionData) => void;
    expressionHead.load.mockReturnValue(
      new Promise<ExpressionData>((resolve) => {
        arrive = resolve;
      }),
    );
    const { container } = renderSpeaking();
    await settle();
    nextFrame();
    expect(
      container.querySelector<HTMLElement>('[data-layer="mouth"]')?.style
        .transform,
    ).not.toBe('');

    // When 표정 데이터가 도착하고 몇 프레임 지나면
    await act(async () => arrive(chloeData));
    await settle();
    nextFrame();

    // Then 표정 머리 자리에는 입 변형이 없다
    const headHost = partOf(container, 'head')?.closest('svg')?.parentElement;
    expect(headHost?.style.transform).toBe('');
  });

  it('표정 데이터를 못 받으면 원래 머리 층으로 남고 경고만 남긴다', async () => {
    // Given
    const failure = new Error('chunk failed');
    expressionHead.load.mockRejectedValue(failure);

    // When
    const { container } = render(
      <PartnerCharacter
        partner="chloe"
        look={{ posture: 'idle', expression: 'neutral' }}
        speech={null}
      />,
    );
    await settle();

    // Then
    expect(container.querySelector('[data-layer="mouth"]')).not.toBeNull();
    expect(reportWarning).toHaveBeenCalledWith(failure, { partner: 'chloe' });
  });
});
