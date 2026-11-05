// 시나리오 대화의 안드로이드 뒤로가기 — 화면을 떠나지 않고 X와 같은 나가기 시트를 열고 닫는지 검증
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { track } from '@/shared/analytics';
import { BridgeListener } from '@/shared/bridge/BridgeListener';

import { ScenarioTalkFlow } from './ScenarioTalkFlow';

const mocks = vi.hoisted(() => ({
  nativeListener: null as ((message: { type: string }) => void) | null,
  postToNative: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: vi.fn(),
    replace: mocks.replace,
    push: vi.fn(),
  }),
  usePathname: () => '/conversation/scenario/1',
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.postToNative,
  subscribeFromNative: (listener: (message: { type: string }) => void) => {
    mocks.nativeListener = listener;
    return () => {
      mocks.nativeListener = null;
    };
  },
}));
vi.mock('@/features/conversation/ui/flow/CharacterStage', () => ({
  CharacterStage: () => null,
}));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('../_model/useScenarioTalkFlow', () => ({
  useScenarioTalkFlow: () => ({
    phase: 'USER_READY',
    turnIndex: 1,
    turn: {
      aiMessage: 'Hi',
      aiTranslation: null,
      isUserOpening: false,
      innerThought: '',
      innerThoughtType: 'NORMAL',
    },
    partner: 'teddy',
    finishedThought: null,
    speech: {},
    replay: undefined,
    input: { transcript: '', keyboardMode: false },
    resend: null,
    leave: vi.fn(),
    sessionId: 1,
    gauge: { filled: 0, total: 5 },
    answerGuide: null,
    markGuideViewed: vi.fn(),
  }),
}));

const scenario = {
  scenarioId: 1,
  completed: false,
  firstSpeaker: 'AI',
} as unknown as Scenario;

const pressBack = () =>
  act(() => mocks.nativeListener?.({ type: 'BACK_PRESSED' }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderTalk = () =>
  render(
    <>
      <BridgeListener />
      <ScenarioTalkFlow scenario={scenario} />
    </>,
  );

describe('ScenarioTalkFlow 뒤로가기', () => {
  it('대화 중 뒤로가기를 누르면 화면 이동·앱 종료 없이 나가기 시트가 열린다', async () => {
    // Given 시나리오 대화 중
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    renderTalk();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // When 뒤로가기를 누르면
    pressBack();

    // Then 시트가 열리고 노출이 찍히며 화면은 그대로다
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('Confirm Sheet Opened', {
      sheet: 'conversation_exit',
    });
    expect(back).not.toHaveBeenCalled();
    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('시트가 열린 뒤 뒤로가기는 시트만 닫아 대화가 이어진다', async () => {
    // Given 나가기 시트가 열려 있다
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    renderTalk();
    pressBack();
    await screen.findByRole('dialog');

    // When 뒤로가기를 누르면
    pressBack();

    // Then 시트만 닫힌다
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(back).not.toHaveBeenCalled();
    expect(mocks.postToNative).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
