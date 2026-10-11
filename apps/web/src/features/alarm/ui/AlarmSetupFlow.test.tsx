// 알람 등록 흐름 계측 — 화면마다 한 번씩 찍혀 어디서 빠지는지 보이는지
import type { AlarmStatus } from '@landit/bridge';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AlarmBlocker } from '../model/alarm-permission';
import { AlarmSetupFlow } from './AlarmSetupFlow';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  unblock: vi.fn(async () => {}),
  blocker: null as AlarmBlocker | null,
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('../model/useAlarmUnblock', () => ({
  useAlarmUnblock: () => ({
    blocker: mocks.blocker,
    setupStep: () => 'finish',
    unblock: mocks.unblock,
    sheet: null,
    closeSheet: () => {},
  }),
}));
// 저장은 바로 성공한다
vi.mock('../model/useSaveAlarmMutation', () => ({
  useSaveAlarmMutation: () => ({
    mutate: (_: unknown, options: { onSuccess: () => void }) =>
      options.onSuccess(),
  }),
}));
// 화면 그림은 보지 않는다 — 단계를 넘기는 손잡이만 둔다
vi.mock('./AlarmIntro', () => ({
  AlarmIntro: ({ onNext }: { onNext: () => void }) => (
    <button onClick={onNext}>소개 다음</button>
  ),
}));
vi.mock('./AlarmPledge', () => ({
  AlarmPledge: ({
    onBack,
    onPledge,
  }: {
    onBack: () => void;
    onPledge: (time: { hour: number; minute: number }) => void;
  }) => (
    <>
      <button onClick={onBack}>다짐 뒤로</button>
      <button onClick={() => onPledge({ hour: 19, minute: 0 })}>다짐</button>
    </>
  ),
}));
vi.mock('./AlarmRegistered', () => ({
  AlarmRegistered: ({ onUnblock }: { onUnblock: () => void }) => (
    <button onClick={onUnblock}>지금 켜기</button>
  ),
}));
vi.mock('./AlarmUnblockSheets', () => ({ AlarmUnblockSheets: () => null }));

// 같은 요소를 다시 넘기면 리액트가 다시 그리지 않는다 — 매번 새로 만든다
const flow = () => (
  <AlarmSetupFlow
    status={{ supported: true } as AlarmStatus}
    initialTime={{ hour: 19, minute: 0 }}
    onDone={() => {}}
    reward={false}
    source="premium_onboarding"
  />
);
const renderFlow = () => render(flow());
const stepsViewed = () =>
  mocks.track.mock.calls
    .filter(([name]) => name === 'Alarm Setup Step Viewed')
    .map(([, props]) => (props as { step: string }).step);

beforeEach(() => {
  vi.useFakeTimers();
  mocks.blocker = null;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AlarmSetupFlow 계측', () => {
  it('열리면 소개를 연 곳과 함께 한 번 찍는다', () => {
    const { rerender } = renderFlow();
    rerender(flow());

    expect(mocks.track.mock.calls).toEqual([
      [
        'Alarm Setup Step Viewed',
        { source: 'premium_onboarding', step: 'intro' },
      ],
    ]);
  });

  it('소개 → 다짐 → 등록 완료를 차례로 찍는다', async () => {
    renderFlow();

    fireEvent.click(screen.getByRole('button', { name: '소개 다음' }));
    fireEvent.click(screen.getByRole('button', { name: '다짐' }));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(stepsViewed()).toEqual(['intro', 'pledge', 'registered']);
  });

  it('다짐에서 소개로 되돌아가면 소개를 다시 본 것으로 찍는다', () => {
    renderFlow();

    fireEvent.click(screen.getByRole('button', { name: '소개 다음' }));
    fireEvent.click(screen.getByRole('button', { name: '다짐 뒤로' }));

    expect(stepsViewed()).toEqual(['intro', 'pledge', 'intro']);
  });

  const reachEnd = async () => {
    fireEvent.click(screen.getByRole('button', { name: '소개 다음' }));
    fireEvent.click(screen.getByRole('button', { name: '다짐' }));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
  };

  it('권한이 막힌 채 끝에 닿으면 완료가 아니라 권한 필요 화면으로 찍는다', async () => {
    mocks.blocker = 'ios-ask';
    renderFlow();

    await reachEnd();

    expect(stepsViewed()).toEqual(['intro', 'pledge', 'permission_needed']);
  });

  it('권한 필요 화면에서 권한이 풀리면 그때 완료를 찍는다', async () => {
    mocks.blocker = 'ios-ask';
    const { rerender } = renderFlow();
    await reachEnd();

    mocks.blocker = null;
    rerender(flow());

    expect(stepsViewed().at(-1)).toBe('registered');
  });

  it('권한 필요 화면의 「지금 켜기」는 등록 흐름에서 풀러 갔다고 찍는다', async () => {
    mocks.blocker = 'ios-ask';
    renderFlow();
    await reachEnd();

    fireEvent.click(screen.getByRole('button', { name: '지금 켜기' }));

    expect(mocks.track).toHaveBeenCalledWith('Alarm Unblock Tapped', {
      blocker: 'ios_ask',
      source: 'setup',
    });
  });
});
