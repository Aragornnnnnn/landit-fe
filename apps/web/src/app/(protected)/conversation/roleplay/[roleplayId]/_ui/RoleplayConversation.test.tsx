// 롤플레이 대화의 안드로이드 뒤로가기 — 화면을 떠나지 않고 X와 같은 끝내기 시트를 열고 닫는지 검증
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RoleplaySessionStartResponse } from '@/features/roleplay/api/roleplay';
import { BridgeListener } from '@/shared/bridge/BridgeListener';

import { useRoleplayTalkFlow } from '../_model/useRoleplayTalkFlow';
import { RoleplayConversation } from './RoleplayConversation';

const mocks = vi.hoisted(() => ({
  nativeListener: null as ((message: { type: string }) => void) | null,
  postToNative: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/conversation/roleplay/7',
}));
vi.mock('next/image', () => ({ default: () => null }));
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
vi.mock('@/features/small-talk/model/useSpeakingLimit', () => ({
  useSpeakingLimit: () => ({ unlimited: true }),
}));
vi.mock('../_model/useRoleplayTalkFlow', () => ({
  useRoleplayTalkFlow: vi.fn(),
}));

const flow = {
  phase: 'USER_READY',
  turnIndex: 1,
  turn: { aiMessage: 'Hi', aiTranslation: null, isUserOpening: false },
  finishedThought: null,
  speech: {},
  replay: undefined,
  input: { transcript: '', keyboardMode: false },
  resend: null,
  pressClose: () => true,
  completing: false,
  completeTalk: vi.fn(),
  remainingMs: 0,
  speakingRatio: 1,
  summary: { speakingDurationMs: 0, exchangeCount: 0 },
};

const session = {
  sessionId: 1,
  character: null,
} as unknown as RoleplaySessionStartResponse;

const pressBack = () =>
  act(() => mocks.nativeListener?.({ type: 'BACK_PRESSED' }));
const sheet = () => screen.queryByRole('dialog');

beforeEach(() => {
  vi.mocked(useRoleplayTalkFlow).mockReturnValue(
    flow as unknown as ReturnType<typeof useRoleplayTalkFlow>,
  );
});

afterEach(() => {
  cleanup();
  mocks.postToNative.mockClear();
});

const renderTalk = () =>
  render(
    <>
      <BridgeListener />
      <RoleplayConversation session={session} />
    </>,
  );

describe('RoleplayConversation 뒤로가기', () => {
  it('대화 중 뒤로가기를 누르면 화면 이동·앱 종료 없이 끝내기 시트가 열린다', async () => {
    // Given 롤플레이 대화 중
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    renderTalk();
    expect(sheet()).not.toBeInTheDocument();

    // When 뒤로가기를 누르면
    pressBack();

    // Then 시트가 열리고 화면은 그대로다
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(back).not.toHaveBeenCalled();
    expect(mocks.postToNative).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('시트가 열린 뒤 뒤로가기는 시트만 닫아 대화가 이어진다', async () => {
    // Given 끝내기 시트가 열려 있다
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    renderTalk();
    pressBack();
    await screen.findByRole('dialog');

    // When 뒤로가기를 누르면
    pressBack();

    // Then 시트만 닫힌다
    await waitFor(() => expect(sheet()).not.toBeInTheDocument());
    expect(back).not.toHaveBeenCalled();
    expect(mocks.postToNative).not.toHaveBeenCalled();
    back.mockRestore();
  });
});
