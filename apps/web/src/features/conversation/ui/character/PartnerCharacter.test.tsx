// PartnerCharacter 립싱크 — 음량 표를 읽기 전후의 입 움직임을 검증한다
// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
